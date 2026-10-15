/* ASPPS AI Assistant v2 — offline NLP engine (no server, no API key)
   Features: weighted keyword + phrase scoring, typo tolerance (fuzzy match),
   English / Hinglish / Hindi keywords, multi-intent answers, follow-up memory,
   "did you mean" fallback, honest "not sure" replies, session history. */
(function () {
  "use strict";

  /* ============================================================
     1. SCHOOL DATA — edit ONLY this block when details change
     ============================================================ */
  const SCHOOL = {
    name: "Ajay Satya Prakash Public School",
    short: "ASPPS",
    phone: "+91-761-2350211",
    phoneAlt: ["+91 9691142224", "+91 6262225081"], // [] to hide  (verify these!)
    email: "aspps011@gmail.com",
    address: "Panagar, Keolari, Jabalpur, Madhya Pradesh – 483220",
    website: "ajaysatyaprakashschool.in",            // verify: old bot said aspsss.in
    hours: "Monday – Saturday, 8:00 AM – 2:00 PM",
    classes: "Class 1 to Class 12",
    board: "CBSE",
    medium: "English",
    established: "2012",                              // "" to hide
    affiliationNo: "1030757"                          // "" to hide
  };
  const BOT = {
    storageKey: "aspps_chat_v2",
    answersUrl: "chatbot-data/answers.json",  // answers YOU write (the bot reads this file)
    logUrl: "chatbot-data/log.php",           // saves unanswered questions into unanswered.csv ("" = off)
    maxLogsPerSession: 5,    // anti-spam: max questions one visitor can log per visit
    onUnanswered: function (q) {} // optional extra hook (analytics etc.)
  };

  const a = (href, text) => `<a href="${href}" ${href.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>${text}</a>`;
  const tel = a("tel:" + SCHOOL.phone.replace(/[^\d+]/g, ""), SCHOOL.phone);
  const mail = a("mailto:" + SCHOOL.email, SCHOOL.email);
  const mapUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(SCHOOL.name + " Panagar Jabalpur");
  const contactLine = `📞 ${tel}<br>✉️ ${mail}`;

  /* ============================================================
     2. INTENTS
     strong = high-confidence words/phrases (weight 4)
     kw     = supporting words/phrases   (weight 2)
     talk   = small-talk (ignored if a real topic is matched)
     more   = extra detail shown when user says "more / details"
     next   = suggestion chips shown after the answer
     ============================================================ */
  const INTENTS = [
    { id: "greeting", talk: true, kw: ["hi", "hello", "hey", "hii", "helo", "namaste", "namaskar", "good morning", "good afternoon", "good evening", "नमस्ते", "नमस्कार"],
      answer: () => `Hello! 👋 Welcome to <strong>${SCHOOL.short}</strong>. I can help with admissions, fees, facilities, timings, contact details and more. What would you like to know?`,
      next: ["Admission", "Fees", "Contact", "Timings"] },
    { id: "thanks", talk: true, kw: ["thanks", "thank you", "thankyou", "thx", "shukriya", "dhanyavad", "dhanyawad", "धन्यवाद", "शुक्रिया", "great", "awesome", "helpful"],
      answer: () => "You're welcome! 😊 Is there anything else I can help you with?", next: ["Admission", "Contact"] },
    { id: "bye", talk: true, kw: ["bye", "goodbye", "see you", "alvida", "tata", "good night"],
      answer: () => "Goodbye! 👋 Have a wonderful day. We'd love to welcome you at " + SCHOOL.short + "." },
    { id: "howareyou", talk: true, kw: ["how are you", "how r u", "kaise ho", "kya haal", "whats up", "sup"],
      answer: () => "I'm doing great, thank you! 😊 How can I help you with the school today?", next: ["Admission", "School Info"] },
    { id: "identity", talk: true, kw: ["who are you", "your name", "what are you", "are you a bot", "are you ai", "are you human", "tum kaun ho", "aap kaun"],
      answer: () => `I'm the <strong>${SCHOOL.short} AI Assistant</strong> 🤖 — a virtual helper that answers using the information published by the school. For anything I can't confirm, I'll point you to the school office.`,
      next: ["School Info", "Contact"] },
    { id: "human", strong: ["talk to someone", "talk to a person", "speak to someone", "speak to a person", "real person", "human agent", "call me", "callback"], kw: ["complaint", "grievance", "urgent", "emergency"],
      answer: () => `For anything that needs a person, please reach the school office directly:<br><br>${contactLine}<br>🕗 ${SCHOOL.hours}`,
      next: ["Contact", "Timings"] },

    { id: "school_info", strong: ["school info", "school information", "about school", "about the school", "about aspps", "about ajay satya prakash", "tell me about", "about your school", "school ke baare mein", "overview"],
      kw: ["school", "aspps", "profile", "introduction", "history", "established", "founded", "affiliation", "affiliated", "cbse", "board", "medium", "co-ed", "coeducation", "vidyalaya", "विद्यालय", "स्कूल"],
      answer: () => `<strong>${SCHOOL.name}</strong> is a co-educational, ${SCHOOL.medium}-medium school in Panagar, Jabalpur, Madhya Pradesh.<br><br>
        • <strong>Board:</strong> ${SCHOOL.board}${SCHOOL.affiliationNo ? " (Affiliation No. " + SCHOOL.affiliationNo + ")" : ""}<br>
        • <strong>Classes:</strong> ${SCHOOL.classes}<br>
        • <strong>Medium:</strong> ${SCHOOL.medium}<br>
        ${SCHOOL.established ? "• <strong>Established:</strong> " + SCHOOL.established + "<br>" : ""}
        • <strong>Focus:</strong> strong academics, values, sports, arts and activities<br><br>
        Read more on the ${a("campus-info.html", "About School page")}.`,
      more: () => `We aim to build confidence and character alongside academics — structured learning for foundational, middle and senior students, plus computer learning, sports, music, dance and arts. See ${a("#aims", "Aims & Objectives")} or watch the ${a("documentary.html", "school documentary")}.`,
      next: ["Admission", "Campus", "Principal", "Contact"] },

    { id: "admission", strong: ["admission", "admissions", "admision", "enroll", "enrol", "enrollment", "new admission", "seat", "seats", "daakhila", "dakhila", "pravesh", "दाखिला", "प्रवेश", "एडमिशन"],
      kw: ["apply", "application", "register", "registration", "join", "joining", "form", "eligibility", "age limit", "documents", "procedure", "process", "how to get"],
      answer: (q) => `${q.kg ? "ℹ️ Our website lists <strong>" + SCHOOL.classes + "</strong>. For Nursery/KG availability, please confirm with the office.<br><br>" : ""}🎓 <strong>Admissions are open</strong> for ${SCHOOL.classes}.<br><br>
        <strong>How to apply:</strong><br>
        1. Visit the school office in Panagar, <em>or</em> call/email us<br>
        2. The office will guide you on the form, eligibility and documents<br>
        3. Complete the formalities for your child's class<br><br>
        📞 ${tel}<br>✉️ ${mail}<br>🕗 ${SCHOOL.hours}<br><br>
        You can also use the ${a("#admission", "Admission section")} or ${a("#contact", "Contact form")}.`,
      more: () => `Please bring your child to the office for a short interaction if asked, and confirm the exact list of required documents by phone before visiting — requirements can change each session. Also see ${a("#terms", "Terms & Conditions")}.`,
      next: ["Fees", "Documents", "Timings", "Contact"] },

    { id: "documents", strong: ["documents required", "required documents", "which documents", "document list", "kaunse documents", "papers required"], kw: ["documents", "document", "certificate", "marksheet", "birth certificate", "aadhar", "aadhaar", "papers"],
      answer: () => `The exact document list depends on the class and previous school. Please confirm with the office before visiting:<br><br>${contactLine}<br><br>For Transfer Certificates, see ${a("#tc", "Uploaded TC")}.`,
      next: ["Admission", "Contact"] },

    { id: "fees", strong: ["fee", "fees", "fess", "fee structure", "tuition", "kitni fees", "shulk", "फीस", "शुल्क"], kw: ["cost", "charges", "price", "payment", "pay", "installment", "expense", "how much", "kitna", "paisa", "discount", "concession"],
      answer: () => `💰 Fee details vary by class, so I don't want to give you a wrong figure. Please get the current <strong>fee structure</strong> from the school office:<br><br>${contactLine}<br>🕗 ${SCHOOL.hours}`,
      next: ["Admission", "Contact", "Timings"] },

    { id: "contact", strong: ["contact", "phone number", "contact number", "mobile number", "call", "email", "e-mail", "mail id", "helpline", "sampark", "संपर्क", "फोन"], kw: ["phone", "number", "whatsapp", "reach", "mail", "enquiry", "inquiry", "query", "write to", "talk"],
      answer: () => `📞 <strong>Phone:</strong> ${tel}${SCHOOL.phoneAlt.length ? "<br>📱 <strong>Also:</strong> " + SCHOOL.phoneAlt.join(", ") : ""}<br>✉️ <strong>Email:</strong> ${mail}<br>📍 <strong>Address:</strong> ${SCHOOL.address}<br>🕗 ${SCHOOL.hours}<br><br>Or use the ${a("#contact", "enquiry form")}.`,
      next: ["Location", "Timings", "Admission"] },

    { id: "location", strong: ["location", "address", "where is", "where are you", "directions", "how to reach", "map", "route", "kahan hai", "pata", "पता", "कहाँ"], kw: ["where", "located", "situated", "near", "landmark", "panagar", "jabalpur", "keolari", "kewlari", "maharajpur", "distance", "find you", "kahan"],
      answer: () => `📍 <strong>${SCHOOL.name}</strong><br>${SCHOOL.address}<br><br>${a(mapUrl, "🗺️ Open in Google Maps")}<br><br>Need help finding us? Call ${tel}.`,
      next: ["Contact", "Timings", "Transport"] },

    { id: "timings", strong: ["timing", "timings", "school timing", "school hours", "office hours", "working hours", "what time", "opening time", "samay", "समय"], kw: ["time", "hours", "open", "close", "closing", "sunday", "saturday", "holiday", "visit", "kab", "kab tak"],
      answer: () => {
        const day = new Date().getDay();
        const note = day === 0 ? "<br><br>📅 Today is Sunday — the office is usually closed. Please visit or call on a working day." : "";
        return `🕗 <strong>Office hours:</strong> ${SCHOOL.hours}.<br><br>Please call ${tel} to confirm before visiting, especially on holidays and exam days.${note}`;
      },
      next: ["Contact", "Location", "Admission"] },

    { id: "campus", strong: ["campus", "infrastructure", "building", "smart class", "smart classroom"], kw: ["facilities", "facility", "classroom", "classrooms", "playground", "ground", "safety", "cctv", "security", "drinking water", "washroom", "toilet", "environment", "amenities", "sapna"],
      answer: () => `🏫 Our campus is designed for focused learning and all-round growth: modern classrooms, ${a("#laboratories", "laboratories")}, a ${a("#library", "library")}, sports and activity spaces.<br><br>See ${a("#infrastructure", "Infrastructure")}, ${a("#features", "Features")} and the ${a("#gallery", "Photo Gallery")}, or take a virtual look at the ${a("documentary.html", "school documentary")}.`,
      next: ["Labs", "Library", "Sports", "Gallery"] },

    { id: "labs", strong: ["lab", "labs", "laboratory", "laboratories", "science lab", "computer lab", "physics lab", "chemistry lab", "biology lab"], kw: ["practical", "experiment", "computer", "computers", "it lab", "stem"],
      answer: () => `🔬 Students learn through hands-on practicals in our ${a("#laboratories", "laboratories")}, along with computer learning to build digital skills.<br><br>For a list of specific labs and equipment, please check with the office: ${tel}.`,
      next: ["Library", "Campus", "Activities"] },

    { id: "library", strong: ["library", "librarian", "books", "reading room", "pustakalaya"], kw: ["reading", "novel", "magazine", "borrow", "issue book"],
      answer: () => `📚 Our ${a("#library", "library")} encourages reading habits and supports students with reference and study material. Ask the office for borrowing and timing details: ${tel}.`,
      next: ["Campus", "Labs", "Activities"] },

    { id: "activities", strong: ["sports", "sport", "activities", "extracurricular", "co-curricular", "music", "dance", "arts", "art and craft", "games", "cricket", "football", "athletics", "yoga"], kw: ["competition", "cultural", "event", "events", "annual day", "sports day", "drawing", "painting", "singing", "hobby", "club", "talent", "prize", "achievement", "khel"],
      answer: () => `🏅 We believe in holistic growth. Students take part in <strong>sports, music, dance, arts, computer learning</strong> and other extracurricular activities alongside academics.<br><br>See highlights in the ${a("#gallery", "Gallery")} and ${a("#news", "News & Updates")}.`,
      next: ["Gallery", "News", "Campus"] },

    { id: "transport", strong: ["transport", "bus", "school bus", "van", "pick up", "pickup", "drop", "bus fee", "bus route", "conveyance"], kw: ["vehicle", "route", "commute"],
      answer: () => `🚌 For transport availability, routes and charges in your area, please contact the office:<br><br>${contactLine}`,
      next: ["Contact", "Fees"] },

    { id: "principal", strong: ["principal", "headmaster", "head of school", "principal message", "pradhanacharya", "प्रधानाचार्य", "प्राचार्य"], kw: ["head", "pradhanacharya"],
      answer: () => `🧑‍🏫 Read the ${a("principal-message.html", "Principal's Message")} on our website. You can also read the ${a("director-message.html", "Director's Message")} and ${a("chairman-message.html", "Chairman's Message")}.`,
      next: ["Director", "Chairman", "Staff"] },
    { id: "director", strong: ["director", "director message", "nideshak", "निदेशक"], kw: [],
      answer: () => `Read the ${a("director-message.html", "Director's Message")}. See also the ${a("principal-message.html", "Principal's")} and ${a("chairman-message.html", "Chairman's")} messages.`,
      next: ["Principal", "Chairman"] },
    { id: "chairman", strong: ["chairman", "chairperson", "founder", "management", "adhyaksh", "अध्यक्ष", "संस्थापक"], kw: ["owner", "trust", "society", "committee"],
      answer: () => `Read the ${a("chairman-message.html", "Chairman's Message")}. See also the ${a("principal-message.html", "Principal's")} and ${a("director-message.html", "Director's")} messages.`,
      next: ["Principal", "Director"] },

    { id: "staff", strong: ["staff", "teachers", "teacher", "faculty", "staff details", "shikshak", "अध्यापक", "शिक्षक"], kw: ["teaching", "qualification", "qualified", "experienced", "mentor", "class teacher", "ma'am", "sir"],
      answer: () => `👩‍🏫 Our supportive teachers guide students from foundational to senior classes. Find the list on the ${a("#staff-details", "Staff Details")} page.`,
      next: ["Principal", "Academics"] },

    { id: "academics", strong: ["academics", "curriculum", "syllabus", "subjects", "stream", "streams", "science stream", "commerce", "arts stream", "board exam", "board preparation", "ncert", "pathyakram"], kw: ["class 9", "class 10", "class 11", "class 12", "classes", "study", "learning", "education", "medium", "teaching", "exam", "exams", "homework", "result", "results", "marks", "pass percentage"],
      answer: (q) => `📖 We follow the <strong>${SCHOOL.board}</strong> curriculum (${SCHOOL.medium} medium) for <strong>${SCHOOL.classes}</strong>.<br><br>
        • <strong>Classes 1–8:</strong> strong foundations in language, maths, science and social studies<br>
        • <strong>Classes 9–12:</strong> board preparation, discipline and future academic goals<br>
        • <strong>Skills:</strong> computers, sports, arts, music, dance<br><br>
        ${/\b(11|12|xi|xii|stream|commerce|science|arts)\b/.test(q.norm) ? "For available subject streams in Classes 11–12, please confirm with the office: " + tel + ".<br><br>" : ""}
        Mandatory info: ${a("#cbse", "CBSE Disclosure")}. Exam schedules &amp; results are posted in ${a("#news", "News &amp; Updates")}.`,
      next: ["Admission", "Staff", "News", "Activities"] },

    { id: "news", strong: ["news", "updates", "notice", "notices", "circular", "circulars", "announcement", "announcements", "notice board", "exam schedule", "date sheet", "datesheet", "timetable", "time table", "holiday list", "suchna", "सूचना"], kw: ["latest", "new", "event", "calendar", "schedule", "vacation", "holidays", "result date"],
      answer: () => `📢 Circulars, exam schedules, achievements and student activities are posted in ${a("#news", "News &amp; Updates")}.`,
      next: ["Academics", "Gallery"] },

    { id: "gallery", strong: ["gallery", "photos", "photo", "pictures", "picture", "images", "image", "videos", "video", "documentary", "slideshow", "tasveer"], kw: ["memories", "moments", "glimpse", "see campus", "show me", "campus tour", "virtual tour"],
      answer: () => `📸 See campus memories, events and student life in our ${a("#gallery", "Photo Gallery")}, or watch the ${a("documentary.html", "School Documentary")}.`,
      next: ["Campus", "Activities", "School Info"] },

    { id: "cbse", strong: ["cbse disclosure", "mandatory disclosure", "mandatory public disclosure", "affiliation number", "affiliation no", "school code", "udise", "recognition"], kw: ["disclosure", "approved", "recognized", "recognised", "government", "fire safety", "sanitary"],
      answer: () => `📄 Our ${a("#cbse", "CBSE Mandatory Public Disclosure")} is on the website.${SCHOOL.affiliationNo ? "<br><br><strong>CBSE Affiliation No.:</strong> " + SCHOOL.affiliationNo : ""}`,
      next: ["School Info", "Admission"] },

    { id: "tc", strong: ["transfer certificate", "tc", "uploaded tc", "school leaving certificate", "slc", "tc download", "tc copy"], kw: ["leaving", "migration", "character certificate"],
      answer: () => `🗂️ Transfer Certificates are listed under ${a("#tc", "Uploaded TC")}. For a new or duplicate TC, please contact the office: ${tel}.`,
      next: ["Contact", "Documents"] },

    { id: "terms", strong: ["terms and conditions", "terms", "rules", "rules and regulations", "policy", "policies", "discipline", "uniform", "dress code"], kw: ["conditions", "regulations", "attendance", "code of conduct", "niyam"],
      answer: () => `📜 Please read our ${a("#terms", "Terms &amp; Conditions")}. For uniform and specific rules, the office can share the latest details: ${tel}.`,
      next: ["Admission", "Contact"] },

    { id: "language", strong: ["hindi", "marathi", "gujarati", "tamil", "telugu", "translate", "language", "change language", "हिन्दी", "हिंदी"], kw: ["bhasha"],
      answer: () => `🌐 You can switch the website language (Hindi, Marathi, Gujarati, Tamil, Telugu) from the <strong>language selector at the top</strong> of the page. I understand English, Hindi and Hinglish questions too!`,
      next: ["Admission", "Contact"] },

    // Things the website does not state — answer honestly instead of guessing.
    { id: "unknown_services", strong: ["hostel", "boarding", "residential", "scholarship", "scholarships", "mess", "canteen", "daycare", "coaching", "neet", "jee", "tuition classes", "pta", "parent teacher meeting", "app", "erp", "online class", "online classes"], kw: ["lunch", "food", "meal", "mid day meal"],
      answer: () => `I don't have confirmed details about that on the website, and I don't want to guess. 🙏 Please ask the school office:<br><br>${contactLine}<br>🕗 ${SCHOOL.hours}`,
      next: ["Contact", "Admission", "Timings"] },

    { id: "feedback", talk: true, kw: ["good school", "best school", "nice school", "is it good", "reviews", "rating", "ranking", "better than"],
      answer: () => `Thank you for your interest! 😊 The best way to judge is to see it yourself — explore the ${a("#gallery", "gallery")}, watch the ${a("documentary.html", "documentary")}, or visit the campus (call ${tel} to schedule).`,
      next: ["Gallery", "Location"] }
  ];

  /* ============================================================
     3. NLP ENGINE
     ============================================================ */
  const normalize = (t) => t.toLowerCase().replace(/[’'`]/g, "")
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

  function lev(x, y, max) {
    if (Math.abs(x.length - y.length) > max) return max + 1;
    let prev = Array.from({ length: y.length + 1 }, (_, j) => j);
    for (let i = 1; i <= x.length; i++) {
      const cur = [i];
      for (let j = 1; j <= y.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[y.length];
  }

  const isLatin = (s) => /^[a-z0-9]+$/.test(s);

  function matchStrength(k, norm, padded, tokens) {
    if (k.includes(" ")) return padded.includes(" " + k + " ") ? 1 : 0;
    if (tokens.includes(k)) return 1;
    if (!isLatin(k)) return tokens.some(t => t.startsWith(k)) ? 0.8 : 0;     // Devanagari etc.
    if (k.length >= 5 && tokens.some(t => t.length > k.length && t.startsWith(k))) return 0.8; // plural / suffix
    if (k.length >= 5) {
      const max = k.length >= 8 ? 2 : 1;
      let best = 9;
      tokens.forEach(t => { if (isLatin(t) && t.length >= 4) best = Math.min(best, lev(t, k, max)); });
      if (best <= max) return best <= 1 ? 0.9 : 0.6; // typo tolerance
    }
    return 0;
  }

  function scoreAll(raw) {
    const norm = normalize(raw);
    const padded = " " + norm + " ";
    const tokens = norm.split(" ").filter(Boolean);
    const q = { raw, norm, tokens, kg: /\b(nursery|lkg|ukg|kg|pre ?nursery|playgroup|play group|pre ?school)\b/.test(norm) };
    const scores = INTENTS.concat(remote).map(it => {
      let s = 0;
      (it.strong || []).forEach(k => { s += 4 * matchStrength(k, norm, padded, tokens); });
      (it.kw || []).forEach(k => { s += 2 * matchStrength(k, norm, padded, tokens); });
      if (it.remote) s = (s + similarity(it, tokens)) * 1.25;   // your sheet answers get priority
      return { it, s };
    }).sort((x, y) => y.s - x.s);
    return { q, scores };
  }

  /* ---- Answers managed from Google Sheet ---- */
  const STOP = new Set(("a an the is are was were am be do does did can could will would should i me my we our you your it its this that these those " +
    "of to in on at for from with about and or but if so as by what which who whom when where why how any there here please tell give " +
    "kya hai hain ho hoga hogi kaise kaun kab kahan kitna kitni mujhe hamare aap apka apki ka ki ke ko se me mein par aur").split(" "));
  const contentTokens = (norm) => norm.split(" ").filter(t => t && !STOP.has(t) && (t.length >= 3 || !isLatin(t)));

  function formatSheetText(t) {
    return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/\r?\n/g, "<br>");
  }

  let remote = [];
  function setRemote(rows) {
    remote = (rows || []).filter(r => r && r.q && r.a).map((r, i) => ({
      id: "sheet" + i, remote: true,
      qTokens: contentTokens(normalize(String(r.q))),
      strong: String(r.k || "").split(/[,;\n]/).map(normalize).filter(Boolean),
      answer: () => formatSheetText(r.a)
    }));
  }

  function similarity(it, tokens) {
    if (!it.qTokens.length) return 0;
    let m = 0;
    it.qTokens.forEach(qt => {
      const max = qt.length >= 8 ? 2 : 1;
      if (tokens.some(t => t === qt || (qt.length >= 5 && t.startsWith(qt)) ||
          (isLatin(qt) && qt.length >= 5 && isLatin(t) && lev(t, qt, max) <= max))) m++;
    });
    const r = m / it.qTokens.length;
    return m >= 1 && r >= 0.6 ? 6 * r : 0;
  }

  /* ---- log questions the bot could not answer ---- */
  const logged = new Set(); let logCount = 0, logReady = false;
  function logUnanswered(raw) {
    try { BOT.onUnanswered(raw); } catch (e) {}
    if (typeof window !== "undefined" && typeof CustomEvent !== "undefined") window.dispatchEvent(new CustomEvent("aspps:unanswered", { detail: raw }));
    if (!BOT.logUrl || !logReady || typeof fetch === "undefined") return false;
    const q = raw.trim().slice(0, 300), key = normalize(q);
    if (q.length >= 3 && !logged.has(key) && logCount < BOT.maxLogsPerSession) {
      logged.add(key); logCount++;
      fetch(BOT.logUrl, { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q }) }).catch(() => {});
    }
    return true;
  }

  const THRESHOLD = 2;
  const MORE_RE = /^(more|tell me more|more details|details|detail|explain|elaborate|aur batao|aur|और बताओ|और)$/;

  const state = { last: null };

  function respond(raw) {
    const { q, scores } = scoreAll(raw);

    // "more / details" follow-up
    if (MORE_RE.test(q.norm) && state.last && state.last.more) {
      return { html: state.last.more(q), next: state.last.next || [], intent: state.last.id };
    }

    let hits = scores.filter(x => x.s >= THRESHOLD);
    const topics = hits.filter(x => !x.it.talk);
    if (topics.length) hits = topics;               // real topics beat small talk

    if (hits.length) {
      const top = hits[0];
      const chosen = [top];
      // multi-intent: "admission and fees", "timing and address"
      if (!top.it.remote && hits[1] && hits[1].s >= top.s * 0.75 && hits[1].s >= 3) chosen.push(hits[1]); // your sheet answer stands alone
      const html = chosen.map(c => c.it.answer(q)).join("<hr class='ai-sep'>");
      state.last = top.it;
      const next = [...new Set(chosen.flatMap(c => c.it.next || []))].slice(0, 4);
      return { html, next, intent: top.it.id };
    }

    // Fallback: suggest closest topics
    const canLog = logUnanswered(raw);
    const close = scores.filter(x => x.s > 1.9 && !x.it.talk).slice(0, 3);
    const labels = { school_info: "School Info", admission: "Admission", fees: "Fees", contact: "Contact", location: "Location", timings: "Timings", campus: "Campus", labs: "Labs", library: "Library", activities: "Sports", transport: "Transport", principal: "Principal", director: "Director", chairman: "Chairman", staff: "Staff", academics: "Academics", news: "News", gallery: "Gallery", cbse: "CBSE Disclosure", tc: "Transfer Certificate", terms: "Rules", documents: "Documents", language: "Language" };
    const suggest = close.map(c => labels[c.it.id]).filter(Boolean);
    const baseHtml = suggest.length
      ? `I'm not completely sure what you meant. 🤔 Did you mean one of these?<br><br>If not, the school office will be happy to help:<br>${contactLine}`
      : `Sorry, I couldn't find an answer to that. 🙏 I can help with <strong>admission, fees, campus, facilities, timings, contact, staff and more</strong> — or please ask the office directly:<br><br>${contactLine}<br>🕗 ${SCHOOL.hours}`;
    const note = canLog ? "<br><br><small>📝 I have noted your question so the school can add an answer soon.</small>" : "";
    const html = baseHtml + note;
    return { html, next: suggest.length ? suggest : ["Admission", "Fees", "Contact", "School Info"], intent: "fallback" };
  }

  if (typeof module !== "undefined") { module.exports = { respond, normalize, setRemote }; }

  /* ============================================================
     4. UI
     ============================================================ */
  const mount = typeof document !== "undefined" && document.getElementById("aspps-ai");
  if (!mount) return;

  async function loadRemote() {
    // 1) your answers file
    if (BOT.answersUrl) {
      try {
        const r = await fetch(BOT.answersUrl, { cache: "no-cache" });   // re-checks the file on every visit
        if (r.ok) {
          const d = await r.json();
          const items = Array.isArray(d) ? d : d.items;
          if (Array.isArray(items)) setRemote(items.filter(x => x && x.active !== false));
        }
      } catch (e) { /* missing file or bad JSON: built-in answers still work */ }
    }
    // 2) is the logger available on this server? (needs PHP; stays off otherwise)
    if (BOT.logUrl) {
      try {
        const r = await fetch(BOT.logUrl, { cache: "no-store" });
        logReady = r.ok && (await r.text()).trim() === "ok";
      } catch (e) { logReady = false; }
    }
  }
  loadRemote();

  const DEFAULT_CHIPS = ["Admission", "Fees", "School Info", "Campus", "Contact", "Gallery", "Principal"];

  mount.innerHTML = `
    <div class="ai-chatbot">
      <button class="ai-button" id="aiOpen" type="button" aria-label="Open AI chatbot" aria-expanded="false">💬</button>
      <div class="ai-window" id="aiWindow" role="dialog" aria-label="${SCHOOL.short} AI Assistant" aria-hidden="true">
        <div class="ai-header">
          <div class="ai-title">🤖 ${SCHOOL.short} AI</div>
          <button id="aiClose" type="button" aria-label="Close AI chatbot">✕</button>
        </div>
        <div class="ai-body" id="aiBody" aria-live="polite"></div>
        <div class="ai-suggestions" id="aiSuggestions" aria-label="Suggested questions"></div>
        <div class="ai-input">
          <input type="text" id="aiInput" placeholder="Ask anything..." aria-label="Type your question" maxlength="300" autocomplete="off">
          <button id="sendMessage" type="button" aria-label="Send message">➤</button>
        </div>
      </div>
    </div>`;

  const $ = (id) => document.getElementById(id);
  const openBtn = $("aiOpen"), closeBtn = $("aiClose"), win = $("aiWindow"),
        body = $("aiBody"), chips = $("aiSuggestions"), input = $("aiInput"), sendBtn = $("sendMessage");

  const openChat = () => { win.classList.add("show"); win.setAttribute("aria-hidden", "false"); openBtn.setAttribute("aria-expanded", "true"); setTimeout(() => input.focus(), 50); };
  const closeChat = () => { win.classList.remove("show"); win.setAttribute("aria-hidden", "true"); openBtn.setAttribute("aria-expanded", "false"); openBtn.focus(); };
  openBtn.addEventListener("click", () => win.classList.contains("show") ? closeChat() : openChat());
  closeBtn.addEventListener("click", closeChat);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && win.classList.contains("show")) closeChat(); });

  let history = [];
  const save = () => { try { sessionStorage.setItem(BOT.storageKey, JSON.stringify(history.slice(-40))); } catch (e) {} };

  function addMessage(content, type, store = true) {
    const div = document.createElement("div");
    div.className = type === "user" ? "user-message" : "bot-message";
    if (type === "user") div.textContent = content; else div.innerHTML = content; // user text is never parsed as HTML
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    if (store) { history.push({ content, type }); save(); }
  }

  function setChips(list) {
    chips.innerHTML = "";
    list.forEach(label => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = label;
      b.addEventListener("click", () => send(label));
      chips.appendChild(b);
    });
  }

  let busy = false;
  function send(text) {
    text = (text || "").trim();
    if (!text || busy) return;
    busy = true;
    addMessage(text, "user");
    const typing = document.createElement("div");
    typing.className = "bot-message ai-typing";
    typing.innerHTML = "<span></span><span></span><span></span>";
    body.appendChild(typing); body.scrollTop = body.scrollHeight;

    const res = respond(text);
    setTimeout(() => {
      typing.remove();
      addMessage(res.html, "bot");
      setChips(res.next && res.next.length ? res.next : DEFAULT_CHIPS);
      busy = false;
    }, 450 + Math.min(res.html.length, 600));
  }

  sendBtn.addEventListener("click", () => { const t = input.value; input.value = ""; send(t); });
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); const t = input.value; input.value = ""; send(t); } });

  // restore or start conversation
  try { history = JSON.parse(sessionStorage.getItem(BOT.storageKey) || "[]"); } catch (e) { history = []; }
  if (history.length) {
    history.forEach(m => addMessage(m.content, m.type, false));
  } else {
    addMessage(`👋 Hello!<br><br>I'm the <strong>${SCHOOL.short} AI Assistant</strong>. Ask me about admissions, fees, facilities, timings or contact details — in English, Hindi or Hinglish.`, "bot");
  }
  setChips(DEFAULT_CHIPS);
})();