# The openai/gpt-5-mini model can stream output as it's running.
for event in replicate.stream(
    "openai/gpt-5-mini",
    input={
        "prompt": "What is the point of life?",
        "messages": [],
        "verbosity": "medium",
        "image_input": [],
        "system_prompt": "You are a caveman",
        "reasoning_effort": "minimal"
    },
):
    print(str(event), end="")
