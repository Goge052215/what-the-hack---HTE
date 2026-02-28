const { spawn } = require("child_process");
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

const createMinimaxCompletion = async ({
  prompt,
  system,
  temperature = 0.2,
  max_tokens = 600,
} = {}) => {
  if (!env.minimaxKey) return { ok: false, error: "missing_key" };
  const response = await fetch(`${env.minimaxBaseUrl}/v1/text/chatcompletion_v2`, {
    method: "POST",
    headers: buildMinimaxHeaders(),
    body: JSON.stringify({
      model: env.minimaxModel,
      messages: [
        { role: "system", name: "MiniMax AI", content: system || "You are a helpful assistant." },
        { role: "user", name: "User", content: prompt || "" },
      ],
      temperature,
      max_tokens,
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
  if (env.usePythonAnthropic) {
    const pythonResult = await createAnthropicInsightPython(prompt);
    if (pythonResult.ok && pythonResult.content) {
      return pythonResult;
    }
  }
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

const createAnthropicInsightPython = async (prompt) => {
  if (!hasAnthropicKey()) return { ok: false, error: "missing_key" };
  const pythonScript = `
import json, sys, os
try:
    import anthropic
except Exception:
    sys.stdout.write(json.dumps({"ok": False, "error": "missing_dependency"}))
    sys.exit(0)
payload = json.loads(sys.stdin.read() or "{}")
api_key = os.getenv("ANTHROPIC_API_KEY")
base_url = os.getenv("ANTHROPIC_BASE_URL")
client = anthropic.Anthropic(api_key=api_key, base_url=base_url or None)
message = client.messages.create(
    model=payload.get("model") or "MiniMax-M2.5",
    max_tokens=int(payload.get("max_tokens") or 220),
    system=payload.get("system") or "You are a helpful assistant.",
    messages=[{
        "role": "user",
        "content": [{"type": "text", "text": payload.get("prompt") or ""}]
    }]
)
text_blocks = [block.text for block in message.content if getattr(block, "type", None) == "text" and getattr(block, "text", None)]
content = "".join(text_blocks).strip()
sys.stdout.write(json.dumps({"ok": True, "content": content}))
`.trim();
  return new Promise((resolve) => {
    const proc = spawn(env.pythonPath, ["-c", pythonScript], {
      env: {
        ...process.env,
        ANTHROPIC_API_KEY: env.anthropicKey,
        ANTHROPIC_BASE_URL: env.anthropicBaseUrl,
      },
    });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", () => {
      resolve({ ok: false, error: "python_failed" });
    });
    proc.on("close", () => {
      if (stderr) {
        resolve({ ok: false, error: "python_error" });
        return;
      }
      try {
        const parsed = JSON.parse(stdout || "{}");
        if (parsed.ok && parsed.content) {
          resolve({ ok: true, content: String(parsed.content).trim() });
          return;
        }
        resolve({ ok: false, error: parsed.error || "invalid_response" });
      } catch {
        resolve({ ok: false, error: "invalid_response" });
      }
    });
    const payload = {
      prompt,
      model: env.anthropicModel,
      max_tokens: 220,
      system: "You are a learning behavior analysis assistant.",
    };
    proc.stdin.write(JSON.stringify(payload));
    proc.stdin.end();
  });
};

const createInsight = async (prompt) => {
  if (hasAnthropicKey()) {
    return createAnthropicInsight(prompt);
  }
  return createMinimaxInsight(prompt);
};

const createSchedulePlan = async (prompt) => {
  return createMinimaxCompletion({
    prompt,
    system: "You are a scheduling assistant that outputs only valid JSON.",
    temperature: 0.2,
    max_tokens: 700,
  });
};

module.exports = { createInsight, createSchedulePlan };
