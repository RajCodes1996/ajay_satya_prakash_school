(function () {
  const mount = document.getElementById("aspps-ai");

  if (!mount) {
    return;
  }

  mount.innerHTML = `
    <div class="ai-chatbot">
      <button class="ai-button" id="aiOpen" type="button" aria-label="Open AI chatbot">
        💬
      </button>

      <div class="ai-window" id="aiWindow" aria-hidden="true">
        <div class="ai-header">
          <div class="ai-title">🤖 ASPPS AI</div>
          <button id="aiClose" type="button" aria-label="Close AI chatbot">✕</button>
        </div>

        <div class="ai-body" id="aiBody">
          <div class="bot-message">
            👋 Hello!<br><br>
            I'm your ASPPS AI Assistant.<br>
            Ask me anything about our school.
          </div>
        </div>

        <div class="ai-suggestions" id="aiSuggestions" aria-label="Suggested questions">
          <button type="button">Admission</button>
          <button type="button">Campus</button>
          <button type="button">Gallery</button>
          <button type="button">Principal</button>
          <button type="button">School Info</button>
        </div>

        <div class="ai-input">
          <input type="text" id="aiInput" placeholder="Ask anything..." aria-label="Type your question">
          <button id="sendMessage" type="button" aria-label="Send message">➤</button>
        </div>
      </div>
    </div>
  `;

  const openBtn = document.getElementById("aiOpen");
  const closeBtn = document.getElementById("aiClose");
  const windowBox = document.getElementById("aiWindow");
  const chatBody = document.getElementById("aiBody");
  const suggestions = document.getElementById("aiSuggestions");
  const aiInput = document.getElementById("aiInput");
  const sendMessageBtn = document.getElementById("sendMessage");

  if (!openBtn || !closeBtn || !windowBox || !chatBody) {
    return;
  }

  const openChat = () => {
    windowBox.classList.add("show");
    windowBox.setAttribute("aria-hidden", "false");
  };

  const closeChat = () => {
    windowBox.classList.remove("show");
    windowBox.setAttribute("aria-hidden", "true");
  };

  openBtn.addEventListener("click", openChat);
  closeBtn.addEventListener("click", closeChat);

  // AI Knowledge Base
  const kb = [
    { keywords: ["school info"], answer: "<strong>Ajay Satya Prakash Public School</strong> is a co-educational, English-medium senior secondary school located in Panagar, Jabalpur, Madhya Pradesh. Established in 2012 and affiliated with the CBSE (Affiliation No. 1030757), it offers classes from Nursery to Grade XII.<br><br><strong>School Overview & Academics</strong><br>• Curriculum: CBSE<br>• Classes: Nursery through Grade 12<br>• Medium: English Medium<br>• Established: 2012<br><br><strong>Campus & Facilities</strong><br>• Modern infrastructure with smart learning rooms<br>• Sports grounds and co-curricular facilities<br>• Transport options available<br><br><strong>Location & Contact</strong><br>• Address: Mouza Kewlari, Maharajpur, Tehsil Panagar, Jabalpur, MP, 483220<br>• Contact: +91 9691142224, +91 6262225081, +91 6262225082<br>• Website: aspsss.in<br>• Hours: Mon-Sat (8:00 AM – 2:00 PM)" },
    { keywords: ["admission", "admissions", "apply", "enroll"], answer: "Admissions are currently open for Classes 1st to 12th! You can find more details in the Academics section or contact us at +0761-2350211." },
    { keywords: ["fee", "fees", "cost"], answer: "For detailed fee structures, please contact our administration office at aspps011@gmail.com or call +0761-2350211." },
    { keywords: ["campus", "infrastructure", "facilities", "lab", "library"], answer: "Our modern campus features well-equipped science and computer laboratories, a comprehensive library, and sports facilities for holistic development." },
    { keywords: ["principal", "director", "chairman"], answer: "You can read the messages from our Director, Principal, and Chairman under the 'Administration' section of the website." },
    { keywords: ["gallery", "photos", "pictures", "images"], answer: "Check out our 'Gallery' section on the homepage to see campus memories, events, and activities." },
    { keywords: ["contact", "phone", "email", "address", "location", "where"], answer: "We are located at Panagar, Keolari, Jabalpur, M.P. 483220. You can reach us at +0761-2350211 or aspps011@gmail.com." },
    { keywords: ["hello", "hi", "hey"], answer: "Hello there! How can I help you learn more about Ajay Satya Prakash Public School today?" },
    { keywords: ["time", "timing", "hours"], answer: "The school office is generally open from 8:00 AM to 2:00 PM on weekdays. Please call to confirm specific meeting times." }
  ];

  const getAIResponse = (text) => {
    const lowerText = text.toLowerCase();
    for (const item of kb) {
      if (item.keywords.some(kw => lowerText.includes(kw))) {
        return item.answer;
      }
    }
    return "I'm not quite sure about that. Please contact the school office at +0761-2350211 or aspps011@gmail.com for more detailed information.";
  };

  const appendMessage = (text, type) => {
    const msgDiv = document.createElement("div");
    msgDiv.className = type === 'user' ? 'user-message' : 'bot-message';
    msgDiv.innerHTML = text;
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  };

  const handleSend = (text) => {
    if (!text) return;
    
    // User message
    appendMessage(text, 'user');
    
    // Bot typing simulation
    const typingId = "typing-" + Date.now();
    const typingDiv = document.createElement("div");
    typingDiv.className = 'bot-message';
    typingDiv.id = typingId;
    typingDiv.innerHTML = '...';
    chatBody.appendChild(typingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;

    setTimeout(() => {
      const typingEl = document.getElementById(typingId);
      if (typingEl) {
        typingEl.remove();
      }
      const response = getAIResponse(text);
      appendMessage(response, 'bot');
    }, 600 + Math.random() * 500); // Simulated delay
  };

  if (suggestions) {
    const suggestionBtns = suggestions.querySelectorAll("button");
    suggestionBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        handleSend(btn.innerText);
      });
    });
  }

  if (sendMessageBtn && aiInput) {
    const sendInputMessage = () => {
      const text = aiInput.value.trim();
      if (text) {
        handleSend(text);
        aiInput.value = '';
      }
    };

    sendMessageBtn.addEventListener("click", sendInputMessage);

    aiInput.addEventListener("keypress", (e) => {
      if (e.key === 'Enter') {
        sendInputMessage();
      }
    });
  }
})();
