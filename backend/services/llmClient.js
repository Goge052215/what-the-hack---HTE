const env = require("../config/env");

const buildMinimaxHeaders = () => ({
  Authorization: `Bearer ${env.minimaxKey}`,
  "Content-Type": "application/json",
});

const buildAnthropicHeaders = () => ({
  "x-api-key": env.anthropicKey,
  "anthropic-version": "2023-06-01",
  "Content-Type": "application/json",
});

const extractMinimaxContent = (payload) => {
  const message = payload?.choices?.[0]?.message;
  if (message?.content) return String(message.content).trim();
  const altMessage = payload?.choices?.[0]?.delta;
  if (altMessage?.content) return String(altMessage.content).trim();
  return "";
};

const extractAnthropicContent = (payload) => {
  const blocks = payload?.content;
  if (!Array.isArray(blocks)) return "";
  const textBlock = blocks.find((block) => block?.type === "text");
  return textBlock?.text ? String(textBlock.text).trim() : "";
};

const hasAnthropicKey = () =>
  Boolean(env.anthropicKey) && !String(env.anthropicKey).startsWith("${");

const createMinimaxInsight = async (prompt) => {
  if (!env.minimaxKey) return { ok: false, error: "missing_key" };
  const response = await fetch(`${env.minimaxBaseUrl}/v1/text/chatcompletion_v2`, {
    method: "POST",
    headers: buildMinimaxHeaders(),
    body: JSON.stringify({
      model: env.minimaxModel,
      messages: [
        { role: "system", name: "MiniMax AI", content: "You are a learning behavior analysis assistant." },
        { role: "user", name: "User", content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 220,
    }),
  });
  if (!response.ok) {
    return { ok: false, error: "request_failed" };
  }
  const payload = await response.json();
  const content = extractMinimaxContent(payload);
  if (!content) return { ok: false, error: "empty_response" };
  return { ok: true, content };
};

const createAnthropicInsight = async (prompt) => {
  if (!hasAnthropicKey()) return { ok: false, error: "missing_key" };
  const response = await fetch(`${env.anthropicBaseUrl}/v1/messages`, {
    method: "POST",
    headers: buildAnthropicHeaders(),
    body: JSON.stringify({
      model: env.anthropicModel,
      max_tokens: 220,
      system: "You are a learning behavior analysis assistant.",
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }],
        },
      ],
    }),
  });
  if (!response.ok) {
    return { ok: false, error: "request_failed" };
  }
  const payload = await response.json();
  const content = extractAnthropicContent(payload);
  if (!content) return { ok: false, error: "empty_response" };
  return { ok: true, content };
};

const createInsight = async (prompt) => {
  if (hasAnthropicKey()) {
    return createAnthropicInsight(prompt);
  }
  return createMinimaxInsight(prompt);
};

module.exports = { createInsight };
