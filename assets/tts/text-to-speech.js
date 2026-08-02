(function () {
  let synth = window.speechSynthesis;
  let isSpeaking = false;
  let ttsButton = null;
  let voices = [];

  // Load voices when they become available
  const populateVoices = () => {
    voices = synth.getVoices();
  };
  
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = populateVoices;
  }

  // Inject CSS for the pulse animation
  const injectStyles = () => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes speakingPulse {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(253, 29, 29, 0.7); }
        50% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(253, 29, 29, 0); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(253, 29, 29, 0); }
      }
      .tts-speaking {
        animation: speakingPulse 1.5s infinite;
        background: linear-gradient(135deg, #11998e, #38ef7d) !important;
      }
    `;
    document.head.appendChild(style);
  };

  // Add the TTS button to the document
  const initTTS = () => {
    // Only initialize if speech synthesis is supported
    if (!('speechSynthesis' in window)) return;
    
    injectStyles();

    ttsButton = document.createElement("button");
    ttsButton.id = "tts-button";
    ttsButton.setAttribute("aria-label", "Read Page Aloud");
    ttsButton.innerHTML = "🔊 School Info";
    
    // Styling the button to match the modern look
    Object.assign(ttsButton.style, {
      position: "fixed",
      left: "30px",
      bottom: "30px",
      zIndex: "9999",
      padding: "12px 20px",
      borderRadius: "30px",
      border: "none",
      background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
      color: "#fff",
      fontWeight: "600",
      fontSize: "14px",
      boxShadow: "0 10px 25px rgba(253, 29, 29, 0.4)",
      cursor: "pointer",
      transition: "all 0.3s ease",
      fontFamily: "Inter, sans-serif"
    });

    ttsButton.addEventListener("mouseover", () => {
      if (!isSpeaking) {
        ttsButton.style.transform = "translateY(-3px)";
        ttsButton.style.boxShadow = "0 15px 35px rgba(253, 29, 29, 0.5)";
      }
    });

    ttsButton.addEventListener("mouseout", () => {
      if (!isSpeaking) {
        ttsButton.style.transform = "translateY(0)";
        ttsButton.style.boxShadow = "0 10px 25px rgba(253, 29, 29, 0.4)";
      }
    });

    ttsButton.addEventListener("click", toggleSpeech);
    document.body.appendChild(ttsButton);
  };

  const setButtonState = (speaking) => {
    isSpeaking = speaking;
    if (speaking) {
      ttsButton.innerHTML = "🎶 Speaking...";
      ttsButton.classList.add("tts-speaking");
    } else {
      ttsButton.innerHTML = "🔊 School Info";
      ttsButton.classList.remove("tts-speaking");
      ttsButton.style.transform = "translateY(0)";
    }
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      synth.cancel();
      setButtonState(false);
    } else {
      // Gather readable text
      const elementsToRead = document.querySelectorAll("h1, h2, h3, p, .stat span, .stat strong");
      let fullText = "";
      
      elementsToRead.forEach(el => {
        if (el.innerText.trim().length > 0 && el.offsetParent !== null) {
            fullText += el.innerText + ". ";
        }
      });

      if (!fullText) {
          fullText = "Welcome to Ajay Satya Prakash Public School.";
      }

      const utterance = new SpeechSynthesisUtterance(fullText);
      utterance.rate = 0.95; // Slightly slower for better comprehension
      utterance.pitch = 1.0;
      
      // Try to find a premium voice (Google UK/US Female is usually good)
      if (voices.length === 0) populateVoices();
      
      const preferredVoices = voices.filter(v => 
        v.name.includes("Google") || v.name.includes("Premium") || v.lang.includes("en-GB")
      );
      
      if (preferredVoices.length > 0) {
        utterance.voice = preferredVoices[0];
      }
      
      utterance.onend = () => {
        setButtonState(false);
      };

      utterance.onerror = () => {
        setButtonState(false);
      };

      synth.speak(utterance);
      setButtonState(true);
    }
  };

  // Wait for the page to load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTTS);
  } else {
    initTTS();
  }
})();
