import os
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model

# Load environment variables from .env
load_dotenv()

# Confirm key is loaded
if not os.environ.get("NVIDIA_API_KEY"):
    raise ValueError("NVIDIA_API_KEY not found. Please set it in .env")

# Initialize NVIDIA model
model = init_chat_model(
    "meta/llama3-70b-instruct",
    "nvidia/nvidia-nemotron-nano-9b-v2"
    "meta/llama-3.1-70b-instruct",
    model_provider="nvidia"
)
