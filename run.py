import uvicorn
import asyncio
import os
import datetime
import json
import webbrowser
from openai import OpenAI

# Paths
STORIES_DIR = "stories"
HISTORY_FILE = os.path.join(STORIES_DIR, "history.json")
os.makedirs(STORIES_DIR, exist_ok=True)

client = OpenAI()

def save_history(entry):
    """Append run entry into history.json"""
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            history = json.load(f)
    else:
        history = []
    history.append(entry)
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

def run_generator():
    """Run a stored prompt, stream output, save story + log history"""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    story_file = f"story_{timestamp}.txt"
    story_path = os.path.join(STORIES_DIR, story_file)

    with client.responses.stream(
        model="gpt-5-mini",  # or "gpt5" if available
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
        final_response = stream.get_final_response()

    with open(story_path, "w", encoding="utf-8") as f:
        f.write(full_text)
    print(f"\n💾 Saved story to {story_path}")

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

async def run_dashboard(open_browser=False):
    """Run FastAPI dashboard server"""
    url = "http://localhost:8000/"
    print(f"🚀 Starting dashboard at {url}")
    if open_browser:
        webbrowser.open(url)
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)

def main():
    print("\n✨ GPT-5 Mini Runner ✨")
    print("1) Generate a new story")
    print("2) Start dashboard")
    print("3) Generate + Dashboard (auto-open browser)")
    choice = input("Enter choice (1/2/3): ").strip()

    if choice == "1":
        run_generator()
    elif choice == "2":
        asyncio.run(run_dashboard())
    elif choice == "3":
        run_generator()
        asyncio.run(run_dashboard(open_browser=True))
    else:
        print("❌ Invalid choice")

if __name__ == "__main__":
    main()
