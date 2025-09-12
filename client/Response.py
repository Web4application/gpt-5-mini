import fs
from openai import OpenAI
from datetime import datetime

# Initialize OpenAI client
client = OpenAI(api_key="YOUR_API_KEY_HERE")

# Step 1: Upload the Draconomicon PDF once
pdf_file_path = "./draconomicon.pdf"
with open(pdf_file_path, "rb") as pdf_file:
    uploaded_file = client.files.create(
        file=pdf_file,
        purpose="user_data"
    )

# Step 2: List of topics you want to explore
topics = [
    "Ancient Red Dragons",
    "The Great Wyrm Gold Dragons",
    "Dragon‑Rider Bonding Rituals",
    "Draconic Magic and Spellcasting",
    "The War of Scales and Flame"
]

# Step 3: Prompt template
def build_prompt(topic):
    return f"""
You are a master loremaster and dragon scholar.
Use the attached document 'draconomicon.pdf' as your primary source of truth.
Always ground your answers in the lore, facts, and details from that document.
If the document does not contain the answer, clearly state that and avoid inventing unsupported details.

TASK:
Provide a detailed, immersive explanation about: {topic}

REQUIREMENTS:
- Include relevant dragon types, abilities, and historical context from the PDF.
- Use vivid, in‑world language as if narrating to an apprentice wizard.
- Where possible, connect the lore to tactical or storytelling applications.
- End with 2–3 creative hooks for how this could be used in a campaign or story.
"""

# Step 4: Loop through topics and collect responses
all_outputs = []
for topic in topics:
    prompt_text = build_prompt(topic)
    response = client.responses.create(
        model="gpt-5",
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": prompt_text},
                    {"type": "input_file", "file_id": uploaded_file.id}
                ]
            }
        ]
    )
    output_text = response.output_text
    all_outputs.append(f"### {topic}\n{output_text}\n")

# Step 5: Save all outputs to a file
timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
output_file = f"draconomicon_lore_{timestamp}.txt"
with open(output_file, "w", encoding="utf-8") as f:
    f.write("\n\n".join(all_outputs))

print(f"✅ Lore entries saved to {output_file}")
