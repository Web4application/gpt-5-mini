from openai import OpenAI
import datetime
import os
import json

# Initialize the client
client = OpenAI()

# Ensure the stories folder exists
STORIES_DIR = "stories"
os.makedirs(STORIES_DIR, exist_ok=True)
HISTORY_FILE = os.path.join(STORIES_DIR, "history.json")

def save_history(entry):
    """Append a run entry into history.json"""
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            history = json.load(f)
    else:
        history = []

    history.append(entry)
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

# Timestamp for filenames
timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
story_file = f"story_{timestamp}.txt"
story_path = os.path.join(STORIES_DIR, story_file)

# Use stored prompt with streaming
with client.responses.stream(
    model="gpt-4.1-mini",   # or "gpt-5-mini" if enabled
    input=[
        {
            "role": "user",
            "content": [
                {
                    "type": "prompt_reference",
                    "id": "pmpt_68abe94a01508196a60556bd525932ca0cb4300eb98ca011",
                    "version": "1"
                }
            ]
        }
    ]
) as stream:
    print("📡 Streaming response...\n")
    full_text = ""

    for event in stream:
        if event.type == "response.output_text.delta":
            print(event.delta, end="", flush=True)
            full_text += event.delta
        elif event.type == "response.completed":
            print("\n\n✅ Generation completed")

    # Grab the final response (contains token + cost info)
    final_response = stream.get_final_response()

# Save the story text
with open(story_path, "w", encoding="utf-8") as f:
    f.write(full_text)

print(f"\n💾 Saved story to {story_path}")

# Save metadata into history.json
entry = {
    "timestamp": timestamp,
    "prompt": "stored_prompt:pmpt_68abe94a01508196a60556bd525932ca0cb4300eb98ca011",
    "output_file": story_file,
    "tokens": {
        "input_tokens": final_response.usage.input_tokens,
        "output_tokens": final_response.usage.output_tokens,
        "total_tokens": final_response.usage.total_tokens,
    },
    "cost_usd": getattr(final_response.usage, "total_cost", 0.0)
}
save_history(entry)

print("📊 Run details saved to history.json")
