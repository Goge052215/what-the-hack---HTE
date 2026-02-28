const env = require("./config/env");

console.log("=== API Key Configuration Check ===");
console.log("MiniMax Key exists:", !!env.minimaxKey);
console.log("MiniMax Key length:", env.minimaxKey?.length || 0);
console.log("MiniMax Key starts with:", env.minimaxKey?.substring(0, 10) || "N/A");
console.log("Anthropic Key exists:", !!env.anthropicKey);
console.log("Anthropic Key length:", env.anthropicKey?.length || 0);
console.log("Anthropic Key starts with:", env.anthropicKey?.substring(0, 10) || "N/A");
console.log("\nIf both keys show 0 length or placeholder text, your .env file needs a real API key.");
