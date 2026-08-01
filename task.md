STEP 1 — Build the Chatbot UI

Our goal is to create a premium chatbot interface that matches your existing website's glassmorphism theme.

Final UI
                          💬

 ┌──────────────────────────────────────┐
 │ 🤖 ASPPS AI Assistant           ✖    │
 ├──────────────────────────────────────┤
 │                                      │
 │ Hello! 👋                           │
 │ I'm your AI Assistant.               │
 │ Ask me anything about our school.    │
 │                                      │
 │  👤 User Message                     │
 │                                      │
 │  🤖 AI Response                      │
 │                                      │
 ├──────────────────────────────────────┤
 │ Admission  Campus  Gallery           │
 ├──────────────────────────────────────┤
 │ Type your question...         ➤      │
 └──────────────────────────────────────┘
Step 1 Folder

Create a new folder (or files in your project root):

assets/
    chatbot/

        chatbot.css
        chatbot.js

This keeps the project organized.

Step 2

In every HTML page, just before the closing </body> tag, add:

<!-- AI Chatbot -->
<link rel="stylesheet" href="assets/chatbot/chatbot.css">

<div id="aspps-ai"></div>

<script src="assets/chatbot/chatbot.js"></script>

Notice that the chatbot injects itself into <div id="aspps-ai"></div>. This keeps your HTML clean.

Step 3 — chatbot.js

For now, create the basic UI dynamically so you don't have to repeat HTML on every page:

const chatbot = `
<div class="ai-chatbot">

    <button class="ai-button" id="aiOpen">
        💬
    </button>

    <div class="ai-window" id="aiWindow">

        <div class="ai-header">

            <div class="ai-title">
                🤖 ASPPS AI
            </div>

            <button id="aiClose">
                ✕
            </button>

        </div>

        <div class="ai-body">

            <div class="bot-message">
                👋 Hello!

                <br><br>

                I'm your ASPPS AI Assistant.

                Ask me anything about our school.
            </div>

        </div>

        <div class="ai-suggestions">

            <button>Admission</button>
            <button>Campus</button>
            <button>Gallery</button>
            <button>Principal</button>

        </div>

        <div class="ai-input">

            <input
                type="text"
                id="aiInput"
                placeholder="Ask anything..."
            >

            <button id="sendMessage">

                ➤

            </button>

        </div>

    </div>

</div>
`;

document.getElementById("aspps-ai").innerHTML = chatbot;

At this stage, don't add any logic yet—we're just rendering the interface.

Step 4 — Open/Close Functionality

Below the previous code, add:

const openBtn = document.getElementById("aiOpen");
const closeBtn = document.getElementById("aiClose");
const windowBox = document.getElementById("aiWindow");

openBtn.onclick = () => {

    windowBox.classList.add("show");

};

closeBtn.onclick = () => {

    windowBox.classList.remove("show");

};
Step 5 — chatbot.css

We'll build a premium glassmorphism design that matches your existing theme.

Start with these sections:

.ai-chatbot{

    position:fixed;

    bottom:30px;

    right:30px;

    z-index:99999;

}
.ai-button{

    width:70px;

    height:70px;

    border-radius:50%;

    border:none;

    cursor:pointer;

    font-size:28px;

    background:linear-gradient(135deg,#4cc9f0,#3a86ff);

    color:white;

    box-shadow:0 20px 40px rgba(0,0,0,.35);

    transition:.35s;

}
.ai-button:hover{

    transform:translateY(-5px) scale(1.08);

}
.ai-window{

    width:380px;

    height:600px;

    position:absolute;

    right:0;

    bottom:90px;

    display:none;

}
.ai-window.show{

    display:flex;

    flex-direction:column;

}
🎯 End of Step 1

After completing this step, you will have:

✅ Floating AI button
✅ Chat window
✅ Open/Close animation hook
✅ Suggestion chips
✅ Input box
✅ Reusable component that works on every page