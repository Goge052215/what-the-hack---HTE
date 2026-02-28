import os
import anthropic

api_key = os.getenv("ANTHROPIC_API_KEY")
base_url = os.getenv("ANTHROPIC_BASE_URL")
model = os.getenv("ANTHROPIC_MODEL") or os.getenv("MINIMAX_MODEL")
if not model:
    if base_url and "minimax" in base_url:
        model = "MiniMax-M2.5"
    else:
        model = "claude-3-5-sonnet-20241022"

client = anthropic.Anthropic(api_key=api_key, base_url=base_url or None)

message = client.messages.create(
    model=model,
    max_tokens=1000,
    system="You are a helpful assistant.",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Hi, how are you?"
                }
            ]
        }
    ]
)

for block in message.content:
    if block.type == "thinking":
        print(f"Thinking:\n{block.thinking}\n")
    elif block.type == "text":
        print(f"Text:\n{block.text}\n")
