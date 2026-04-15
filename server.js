const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEFAULT_MODEL = "gpt-4o-mini";
const ALLOWED_MODELS = new Set(["gpt-4o-mini", "gpt-4.1-mini", "gpt-5.4"]);
const SYSTEM_PROMPT = "You are FlowMart's shopping assistant. Help with products, sizing, cart, checkout, and order flow. Keep answers clear and practical.";

app.use(express.json({ limit: "15mb" }));
app.use(express.static(path.join(__dirname)));

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => {
      const role = entry.role === "assistant" ? "assistant" : "user";
      const content = typeof entry.content === "string" ? entry.content.trim() : "";
      const imageUrl = typeof entry.imageUrl === "string"
        ? entry.imageUrl.trim()
        : typeof entry.image_url === "string"
          ? entry.image_url.trim()
          : "";

      return { role, content, imageUrl };
    })
    .filter((entry) => {
      if (entry.role === "assistant") {
        return Boolean(entry.content);
      }

      return Boolean(entry.content) || Boolean(entry.imageUrl);
    });
}

function normalizeInput(input) {
  if (!Array.isArray(input)) return [];

  return input.filter(
    (entry) =>
      entry &&
      typeof entry === "object" &&
      typeof entry.role === "string" &&
      entry.content !== undefined
  );
}

function buildResponsesInput(messages) {
  return messages.map((message) => {
    if (message.role === "assistant") {
      return {
        role: "assistant",
        content: message.content
      };
    }

    const content = [];
    if (message.content) {
      content.push({ type: "input_text", text: message.content });
    }

    if (message.imageUrl) {
      content.push({ type: "input_image", image_url: message.imageUrl });
    }

    return {
      role: "user",
      content
    };
  });
}

function extractAssistantText(data) {
  if (data && typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  if (!Array.isArray(data && data.output)) {
    return "";
  }

  const parts = [];
  data.output.forEach((item) => {
    if (!item || !Array.isArray(item.content)) return;

    item.content.forEach((contentPart) => {
      if (contentPart && typeof contentPart.text === "string") {
        parts.push(contentPart.text);
      }
    });
  });

  return parts.join("\n").trim();
}

app.post("/api/chat", async (req, res) => {
  if (!OPENAI_API_KEY) {
    res.status(500).json({ error: "Server is missing OPENAI_API_KEY." });
    return;
  }

  const modelFromRequest = typeof req.body?.model === "string" ? req.body.model : DEFAULT_MODEL;
  const model = ALLOWED_MODELS.has(modelFromRequest) ? modelFromRequest : DEFAULT_MODEL;

  const messages = normalizeMessages(req.body?.messages);
  const providedInput = normalizeInput(req.body?.input);
  const input = providedInput.length ? providedInput : buildResponsesInput(messages);
  const instructions = typeof req.body?.instructions === "string" && req.body.instructions.trim()
    ? req.body.instructions.trim()
    : SYSTEM_PROMPT;

  if (!input.length) {
    res.status(400).json({ error: "At least one chat message or input item is required." });
    return;
  }

  try {
    const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model,
        instructions,
        input
      })
    });

    let data = null;
    try {
      data = await openAiResponse.json();
    } catch {
      data = null;
    }

    if (!openAiResponse.ok) {
      const errorMessage = data && data.error && data.error.message
        ? data.error.message
        : `OpenAI request failed with status ${openAiResponse.status}.`;
      res.status(openAiResponse.status).json({ error: errorMessage });
      return;
    }

    const reply = extractAssistantText(data);
    if (!reply) {
      res.status(502).json({ error: "No text content returned from OpenAI." });
      return;
    }

    res.json({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected proxy error.";
    res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`FlowMart server running at http://localhost:${PORT}`);
});
