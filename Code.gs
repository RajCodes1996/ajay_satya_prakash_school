/**
 * ASPPS Chatbot backend — paste into Extensions > Apps Script of your Google Sheet.
 * 1) Run setup() once.   2) Deploy > New deployment > Web app
 *    (Execute as: Me, Who has access: Anyone)  3) Copy the /exec URL into chatbot.js (BOT.endpoint).
 *
 * Sheets created:
 *  "Unanswered": Date | Question | Times asked | YOUR ANSWER | Keywords (optional) | Publish ✔ | Status
 *  "Answers"   : Question | Keywords | Answer | Active ✔ | Updated      (this is what the bot reads)
 */
const ANSWERS = "Answers", LOG = "Unanswered", MAX_ROWS = 3000;

function setup() {
  const ss = SpreadsheetApp.getActive();
  let a = ss.getSheetByName(ANSWERS) || ss.insertSheet(ANSWERS);
  let u = ss.getSheetByName(LOG) || ss.insertSheet(LOG);
  a.getRange(1, 1, 1, 5).setValues([["Question", "Keywords (comma separated, optional)", "Answer", "Active", "Updated"]]).setFontWeight("bold");
  u.getRange(1, 1, 1, 7).setValues([["Date", "Question", "Times asked", "YOUR ANSWER (type here)", "Keywords (optional)", "Publish", "Status"]]).setFontWeight("bold");
  a.getRange("D2:D1000").insertCheckboxes();
  u.getRange("F2:F1000").insertCheckboxes();
  a.setFrozenRows(1); u.setFrozenRows(1);
  a.setColumnWidth(3, 450); u.setColumnWidth(2, 300); u.setColumnWidth(4, 450);
}

// Bot reads published answers
function doGet() {
  const cache = CacheService.getScriptCache();
  let json = cache.get("answers");
  if (!json) {
    const sh = SpreadsheetApp.getActive().getSheetByName(ANSWERS);
    const n = sh.getLastRow() - 1;
    const rows = n > 0 ? sh.getRange(2, 1, n, 4).getValues() : [];
    const items = rows.filter(r => r[0] && r[2] && r[3] !== false)
      .map(r => ({ q: String(r[0]), k: String(r[1] || ""), a: String(r[2]) }));
    json = JSON.stringify({ items: items });
    cache.put("answers", json, 60);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

// Bot reports questions it could not answer
function doPost(e) {
  try { logQuestion_(String(JSON.parse(e.postData.contents).q || "")); }
  catch (err) { console.error("doPost failed: " + err); }   // see it under "Executions"
  return ok_();
}

function logQuestion_(raw) {
  const q = raw.trim().slice(0, 300);
  if (q.length < 3) return;
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const sh = SpreadsheetApp.getActive().getSheetByName(LOG);
    const last = sh.getLastRow();
    if (last > MAX_ROWS) return;
    const safe = /^[=+\-@]/.test(q) ? "'" + q : q;           // block spreadsheet formula injection
    const norm = (t) => String(t).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ");
    if (last > 1) {
      const qs = sh.getRange(2, 2, last - 1, 1).getValues();
      for (let i = 0; i < qs.length; i++) {
        if (norm(qs[i][0]) === norm(q)) {                    // same question again: count it
          const c = sh.getRange(i + 2, 3);
          c.setValue((Number(c.getValue()) || 1) + 1);
          return;
        }
      }
    }
    sh.appendRow([new Date(), safe, 1, "", "", false, "New"]);
    sh.getRange(sh.getLastRow(), 6).insertCheckboxes();
  } finally { lock.releaseLock(); }
}

// Run this from the editor to test saving (errors show in the Execution log)
function testLog() { logQuestion_("test from editor"); }
const ok_ = () => ContentService.createTextOutput("ok");

// Tick "Publish" on an Unanswered row => it moves to Answers and goes live in the bot
function onEdit(e) {
  const sh = e.range.getSheet(), name = sh.getName();
  if (name === ANSWERS) { try { CacheService.getScriptCache().remove("answers"); } catch (x) {} return; }
  if (name !== LOG || e.range.getColumn() !== 6 || e.range.getRow() < 2) return;
  if (String(e.value).toUpperCase() !== "TRUE") return;
  const row = sh.getRange(e.range.getRow(), 1, 1, 7).getValues()[0];
  const question = row[1], answer = String(row[3] || "").trim(), keywords = row[4];
  if (!answer) { e.range.setValue(false); e.source.toast("Write the answer in column D first.", "Not published"); return; }
  const a = e.source.getSheetByName(ANSWERS);
  a.appendRow([question, keywords, answer, true, new Date()]);
  a.getRange(a.getLastRow(), 4).insertCheckboxes().check();
  sh.getRange(e.range.getRow(), 7).setValue("Published ✓ " + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd MMM yyyy"));
  try { CacheService.getScriptCache().remove("answers"); } catch (x) {}
  e.source.toast("Live in the chatbot within a minute.", "Published");
}