const { spawn } = require("child_process");
const path = require("path");
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

const minimaxTimeoutMs = 12000;

const isMinimaxBaseUrl = (baseUrl) =>
  typeof baseUrl === "string" && baseUrl.toLowerCase().includes("minimax");

const resolveAnthropicModel = () => {
  if (process.env.ANTHROPIC_MODEL) return process.env.ANTHROPIC_MODEL;
  if (process.env.MINIMAX_MODEL && isMinimaxBaseUrl(env.anthropicBaseUrl)) {
    return process.env.MINIMAX_MODEL;
  }
  if (isMinimaxBaseUrl(env.anthropicBaseUrl)) {
    return env.minimaxModel || "MiniMax-M2.5";
  }
  return "claude-3-5-sonnet-20241022";
};

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

const createMinimaxRequest = async (body) => {
  if (!env.minimaxKey) return { ok: false, error: "missing_key" };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), minimaxTimeoutMs);
  try {
    const response = await fetch(`${env.minimaxBaseUrl}/v1/text/chatcompletion_v2`, {
      method: "POST",
      headers: buildMinimaxHeaders(),
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      return { ok: false, error: "request_failed", status: response.status };
    }
    const payload = await response.json().catch(() => null);
    if (!payload) return { ok: false, error: "invalid_response" };
    const content = extractMinimaxContent(payload);
    if (!content) return { ok: false, error: "empty_response" };
    return { ok: true, content };
  } catch (error) {
    if (error?.name === "AbortError") {
      return { ok: false, error: "timeout" };
    }
    return { ok: false, error: "request_failed" };
  } finally {
    clearTimeout(timeout);
  }
};

const createMinimaxInsight = async (prompt) => {
  return createMinimaxRequest({
    model: env.minimaxModel,
    messages: [
      { role: "system", name: "MiniMax AI", content: "You are a learning behavior analysis assistant." },
      { role: "user", name: "User", content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 220,
  });
};

const createMinimaxCompletion = async ({
  prompt,
  system,
  temperature = 0.2,
  max_tokens = 600,
} = {}) => {
  return createMinimaxRequest({
    model: env.minimaxModel,
    messages: [
      { role: "system", name: "MiniMax AI", content: system || "You are a helpful assistant." },
      { role: "user", name: "User", content: prompt || "" },
    ],
    temperature,
    max_tokens,
  });
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
      model: resolveAnthropicModel(),
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
model = payload.get("model")
if not model:
    if base_url and "minimax" in base_url.lower():
        model = os.getenv("MINIMAX_MODEL") or "MiniMax-M2.5"
    else:
        model = "claude-3-5-sonnet-20241022"
client = anthropic.Anthropic(api_key=api_key, base_url=base_url or None)
message = client.messages.create(
    model=model,
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
      model: resolveAnthropicModel(),
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
    system: "You are a scheduling assistant that outputs only valid JSON. Suggest practice events after class-assignment tasks. Suggest revision events before class-exam tasks. Suggest relaxation after class-tasks events.",
    temperature: 0.2,
    max_tokens: 700,
  });
};

const createScheduleSuggestions = async (prompt) => {
  return createMinimaxCompletion({
    prompt,
    system: "You are a scheduling assistant that outputs only valid JSON.",
    temperature: 0.3,
    max_tokens: 260,
  });
};

const createScheduleSuggestionsViaApi = async ({ description, type, deadline } = {}) => {
  const pythonScript = `
import json, sys, os
payload = json.loads(sys.stdin.read() or "{}")
client_path = os.getenv("FOCUS_TUTOR_API_CLIENT_PATH")
if client_path:
    sys.path.insert(0, client_path)
try:
    import api as api_client
except Exception:
    sys.stdout.write(json.dumps({"ok": False, "error": "missing_client"}))
    sys.exit(0)
description = payload.get("description") or ""
task_type = payload.get("type") or "task"
deadline = payload.get("deadline")
base_url = payload.get("base_url")
result = api_client.schedule_suggestions(description, task_type=task_type, deadline=deadline, base_url=base_url)
sys.stdout.write(json.dumps(result))
`.trim();
  return new Promise((resolve) => {
    const proc = spawn(env.pythonPath, ["-c", pythonScript], {
      env: {
        ...process.env,
        FOCUS_TUTOR_API_CLIENT_PATH: path.resolve(__dirname, "../../extension/ui/api"),
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
        const suggestions = parsed?.data?.suggestions;
        if (parsed?.ok && Array.isArray(suggestions) && suggestions.length > 0) {
          resolve({
            ok: true,
            suggestions,
            source: parsed?.data?.source || "api",
          });
          return;
        }
        resolve({ ok: false, error: parsed?.error || "invalid_response" });
      } catch {
        resolve({ ok: false, error: "invalid_response" });
      }
    });
    const payload = {
      description,
      type,
      deadline,
      base_url: process.env.FOCUS_TUTOR_API_BASE_URL || undefined,
    };
    proc.stdin.write(JSON.stringify(payload));
    proc.stdin.end();
  });
};

module.exports = {
  createInsight,
  createSchedulePlan,
  createScheduleSuggestions,
  createScheduleSuggestionsViaApi,
};
