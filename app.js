
const $ = (id) => document.getElementById(id);

// Sidebar navigation
function showPage(page) {
  document.querySelectorAll(".page").forEach(p => {
    p.classList.remove("active");
  });

  $(page).classList.add("active");

  const titles = {
    chat: "AI Chat",
    photo: "Photo Editor",
    video: "Video Studio",
    voice: "Voice Studio"
  };

  $("pageTitle").textContent = titles[page];
}

// Chat interface
function addMessage(text, type) {
  const div = document.createElement("div");

  div.className = "message " + type;
  div.textContent = text;

  $("messages").appendChild(div);

  div.scrollIntoView({ behavior: "smooth" });
}

async function sendMessage() {
  const input = $("userInput");
  const text = input.value.trim();

  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: text })
    });

    if (!response.ok) {
      throw new Error("AI service unavailable");
    }

    const data = await response.json();

    addMessage(data.reply, "ai");

  } catch (error) {
    addMessage(
      "AI connection is not ready. Please start the backend and configure your AI API.",
      "ai"
    );
  }
}

$("userInput").addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

// Photo editor
let originalPhoto = null;

$("photoFile").addEventListener("change", event => {
  const file = event.target.files[0];

  if (!file) return;

  const image = new Image();

  image.onload = () => {
    originalPhoto = image;

    const canvas = $("photoCanvas");
    const ctx = canvas.getContext("2d");

    canvas.width = image.width;
    canvas.height = image.height;

    ctx.drawImage(image, 0, 0);
  };

  image.src = URL.createObjectURL(file);
});

function editPhoto(type) {
  if (!originalPhoto) {
    alert("Please upload a photo first.");
    return;
  }

  const canvas = $("photoCanvas");
  const ctx = canvas.getContext("2d");

  ctx.filter = "none";

  if (type === "gray") {
    ctx.filter = "grayscale(100%)";
  }

  if (type === "bright") {
    ctx.filter = "brightness(130%)";
  }

  ctx.drawImage(
    originalPhoto, 0, 0,
    canvas.width, canvas.height
  );

  ctx.filter = "none";
}

function downloadPhoto() {
  const canvas = $("photoCanvas");

  if (!originalPhoto) {
    alert("Upload a photo first.");
    return;
  }

  const link = document.createElement("a");
  link.download = "saara-edited-photo.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// Video preview
$("videoFile").addEventListener("change", event => {
  const file = event.target.files[0];

  if (!file) return;

  $("videoPreview").src = URL.createObjectURL(file);
});

// Voice recording
let recorder;
let chunks = [];
let recording = false;

async function toggleRecording() {
  if (recording) {
    recorder.stop();
    recording = false;
    $("recordButton").textContent = "🎙️ Start Recording";
    return;
  }

  try {
    const stream = await navigator.mediaDevices
      .getUserMedia({ audio: true });

    recorder = new MediaRecorder(stream);
    chunks = [];

    recorder.ondataavailable = event => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const audioBlob = new Blob(chunks, {
        type: recorder.mimeType
      });

      $("audioPreview").src =
        URL.createObjectURL(audioBlob);

      stream.getTracks().forEach(track => track.stop());
    };

    recorder.start();
    recording = true;

    $("recordButton").textContent = "⏹ Stop Recording";

  } catch (error) {
    alert("Microphone permission is required.");
  }
}

// Text-to-speech
function speakText() {
  const text = $("voiceText").value.trim();

  if (!text) {
    alert("Please enter some text first.");
    return;
  }

  if (!("speechSynthesis" in window)) {
    alert("Speech is not supported in this browser.");
    return;
  }

  const speech = new SpeechSynthesisUtterance(text);

  speech.lang = "en-IN";
  speech.rate = 1;

  speechSynthesis.cancel();
  speechSynthesis.speak(speech);
}
