const CHAT_HISTORY_KEY = "flowmartChatHistory";
const CHAT_MODEL_KEY = "flowmartChatModel";
const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

let chatMessages = [];
let isSubmitting = false;
let pendingImageDataUrl = "";
let pendingImageName = "";

let chatModelSelect;
let chatClearHistoryButton;
let chatStatus;
let chatHistory;
let chatForm;
let chatInput;
let chatSendButton;
let chatImageInput;
let chatImagePickButton;
let chatImageRemoveButton;
let chatImagePreviewWrap;
let chatImagePreview;
let chatImageInfo;

function readJson(key, fallbackValue) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallbackValue;
  try {
    return JSON.parse(raw);
  } catch {
    return fallbackValue;
  }
}

function normalizeMessage(entry) {
  if (!entry || typeof entry !== "object") return null;
  const role = entry.role === "assistant" ? "assistant" : entry.role === "user" ? "user" : null;
  if (!role) return null;
  const content = typeof entry.content === "string" ? entry.content.trim() : "";
  const imageUrl = typeof entry.imageUrl === "string" ? entry.imageUrl.trim() : "";
  if (!content && !imageUrl) return null;
  if (role === "assistant" && !content) return null;
  const createdAt = typeof entry.createdAt === "number" ? entry.createdAt : Date.now();
  return { role, content, imageUrl, createdAt };
}

function loadHistory() {
  const saved = readJson(CHAT_HISTORY_KEY, []);
  if (!Array.isArray(saved)) return [];
  return saved.map(normalizeMessage).filter(Boolean);
}

function saveHistory() {
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatMessages));
}

function saveModelPreference() {
  if (!chatModelSelect) return;
  localStorage.setItem(CHAT_MODEL_KEY, chatModelSelect.value);
}

function loadModelPreference() {
  return localStorage.getItem(CHAT_MODEL_KEY) || DEFAULT_MODEL;
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function showStatus(message, type = "error") {
  if (!chatStatus) return;
  chatStatus.classList.remove("show", "success");
  if (!message) return;
  chatStatus.textContent = message;
  chatStatus.classList.add("show");
  if (type === "success") {
    chatStatus.classList.add("success");
  }
}

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / (1024 ** power);
  const precision = power === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[power]}`;
}

function updatePendingImageUI() {
  if (!chatImageInfo || !chatImagePreviewWrap || !chatImagePreview || !chatImageRemoveButton) return;

  if (!pendingImageDataUrl) {
    chatImageInfo.textContent = "No image selected";
    chatImagePreview.src = "";
    chatImagePreviewWrap.classList.add("assistant-hidden");
    chatImageRemoveButton.disabled = true;
    return;
  }

  chatImageInfo.textContent = pendingImageName || "Image selected";
  chatImagePreview.src = pendingImageDataUrl;
  chatImagePreviewWrap.classList.remove("assistant-hidden");
  chatImageRemoveButton.disabled = false;
}

function clearPendingImage(options = {}) {
  pendingImageDataUrl = "";
  pendingImageName = "";

  const shouldClearInput = options.clearInput !== false;
  if (shouldClearInput && chatImageInput) {
    chatImageInput.value = "";
  }

  updatePendingImageUI();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

async function handleImageSelection(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!file.type || !file.type.startsWith("image/")) {
    clearPendingImage();
    showStatus("Please choose a valid image file.");
    return;
  }

  if (file.size > MAX_IMAGE_BYTES) {
    clearPendingImage();
    showStatus(`Image is too large. Max size is ${formatBytes(MAX_IMAGE_BYTES)}.`);
    return;
  }

  try {
    pendingImageDataUrl = await readFileAsDataUrl(file);
    pendingImageName = `${file.name} (${formatBytes(file.size)})`;
    updatePendingImageUI();
    showStatus("");
  } catch (error) {
    clearPendingImage();
    const message = error instanceof Error ? error.message : "Unable to read selected image.";
    showStatus(message);
  }
}

function renderHistory() {
  if (!chatHistory) return;

  if (!chatMessages.length && !isSubmitting) {
    chatHistory.innerHTML = "<p class=\"assistant-empty\">Start the conversation to see full history here.</p>";
    return;
  }

  const messageMarkup = chatMessages
    .map((message) => {
      const author = message.role === "assistant" ? "Assistant" : "You";
      return `
        <article class="assistant-message ${message.role}">
          <div class="assistant-meta">
            <strong>${author}</strong>
            <time>${formatTime(message.createdAt)}</time>
          </div>
          <p class="assistant-body"></p>
          <img class="assistant-image" alt="Shared image" />
        </article>
      `;
    })
    .join("");

  chatHistory.innerHTML = messageMarkup;

  const messageBodies = chatHistory.querySelectorAll(".assistant-body");
  const messageImages = chatHistory.querySelectorAll(".assistant-image");
  chatMessages.forEach((message, index) => {
    if (messageBodies[index]) {
      messageBodies[index].textContent = message.content;
    }

    if (messageImages[index]) {
      if (message.imageUrl) {
        messageImages[index].src = message.imageUrl;
        messageImages[index].classList.add("show");
      } else {
        messageImages[index].src = "";
        messageImages[index].classList.remove("show");
      }
    }
  });

  if (isSubmitting) {
    const typing = document.createElement("article");
    typing.className = "assistant-message assistant";
    typing.innerHTML = `
      <div class="assistant-meta">
        <strong>Assistant</strong>
        <time>typing...</time>
      </div>
      <p class="assistant-body assistant-typing">Thinking...</p>
    `;
    chatHistory.appendChild(typing);
  }

  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function setSubmitting(state) {
  isSubmitting = state;
  if (chatSendButton) chatSendButton.disabled = state;
  if (chatInput) chatInput.disabled = state;
  if (chatClearHistoryButton) chatClearHistoryButton.disabled = state;
  if (chatModelSelect) chatModelSelect.disabled = state;
  if (chatImagePickButton) chatImagePickButton.disabled = state;
  if (chatImageInput) chatImageInput.disabled = state;
  if (chatImageRemoveButton) chatImageRemoveButton.disabled = state || !pendingImageDataUrl;
  renderHistory();
}

function clearHistory() {
  chatMessages = [];
  localStorage.removeItem(CHAT_HISTORY_KEY);
  clearPendingImage();
  showStatus("History cleared.", "success");
  renderHistory();
}

function buildProxyMessages() {
  return chatMessages.map((message) => ({
    role: message.role,
    content: message.content,
    imageUrl: message.imageUrl || ""
  }));
}

async function requestAssistantReply(model) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: buildProxyMessages()
    })
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data && typeof data.error === "string" ? data.error : `Proxy request failed with status ${response.status}.`;
    throw new Error(message);
  }

  const assistantText = data && typeof data.reply === "string" ? data.reply.trim() : "";
  if (!assistantText) {
    throw new Error("No text came back from the proxy response.");
  }

  return assistantText;
}

async function submitChat(event) {
  event.preventDefault();
  if (isSubmitting) return;

  const prompt = chatInput.value.trim();
  if (!prompt && !pendingImageDataUrl) {
    showStatus("Write a message or upload an image before sending.");
    return;
  }

  const model = chatModelSelect ? chatModelSelect.value || DEFAULT_MODEL : DEFAULT_MODEL;
  chatMessages.push({
    role: "user",
    content: prompt,
    imageUrl: pendingImageDataUrl,
    createdAt: Date.now()
  });
  saveHistory();

  chatInput.value = "";
  clearPendingImage();
  showStatus("");
  setSubmitting(true);

  try {
    const reply = await requestAssistantReply(model);
    chatMessages.push({ role: "assistant", content: reply, imageUrl: "", createdAt: Date.now() });
    saveHistory();
    showStatus("Reply received.", "success");
  } catch (error) {
    const fallback = "Request failed. Start the backend with npm run start and open the app at http://localhost:3000.";
    showStatus(error instanceof Error ? error.message : fallback);
  } finally {
    setSubmitting(false);
  }
}

function handleInputKeydown(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  chatModelSelect = document.getElementById("chat-model");
  chatClearHistoryButton = document.getElementById("chat-clear-history");
  chatStatus = document.getElementById("chat-status");
  chatHistory = document.getElementById("chat-history");
  chatForm = document.getElementById("chat-form");
  chatInput = document.getElementById("chat-input");
  chatSendButton = document.getElementById("chat-send");
  chatImageInput = document.getElementById("chat-image-input");
  chatImagePickButton = document.getElementById("chat-image-pick");
  chatImageRemoveButton = document.getElementById("chat-image-remove");
  chatImagePreviewWrap = document.getElementById("chat-image-preview-wrap");
  chatImagePreview = document.getElementById("chat-image-preview");
  chatImageInfo = document.getElementById("chat-image-info");

  if (!chatForm || !chatInput || !chatHistory) return;

  if (chatModelSelect) {
    const preferredModel = loadModelPreference();
    const hasOption = Array.from(chatModelSelect.options).some((option) => option.value === preferredModel);
    chatModelSelect.value = hasOption ? preferredModel : DEFAULT_MODEL;
    chatModelSelect.addEventListener("change", saveModelPreference);
  }

  chatMessages = loadHistory();
  renderHistory();
  updatePendingImageUI();

  chatForm.addEventListener("submit", submitChat);
  chatInput.addEventListener("keydown", handleInputKeydown);

  if (chatImageInput) {
    chatImageInput.addEventListener("change", handleImageSelection);
  }

  if (chatImagePickButton && chatImageInput) {
    chatImagePickButton.addEventListener("click", function () {
      chatImageInput.click();
    });
  }

  if (chatImageRemoveButton) {
    chatImageRemoveButton.addEventListener("click", function () {
      clearPendingImage();
    });
  }

  if (window.location.protocol === "file:") {
    showStatus("Chat needs the backend proxy. Run npm run start and open http://localhost:3000.");
  }

  if (chatClearHistoryButton) {
    chatClearHistoryButton.addEventListener("click", function () {
      const shouldClear = window.confirm("Clear the full conversation history?");
      if (shouldClear) {
        clearHistory();
      }
    });
  }
});
