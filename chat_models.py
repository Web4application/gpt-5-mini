helm fetch https://helm.ngc.nvidia.com/nim/charts/nim-llm-1.3.0.tgz --username='$oauthtoken' --password=$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


import getpass
import os

if not os.environ.get("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"):
  os.environ["NVIDIA_API_KEY"] = getpass.getpass("Enter API key for NVIDIA: ")

from langchain.chat_models import init_chat_model

model = init_chat_model("meta/llama3-70b-instruct", model_provider="nvidia")
