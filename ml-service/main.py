import torch
from fastapi import FastAPI
from pydantic import BaseModel
from your_pipeline_file import hybrid_function, DEVICE  # import from your existing code

app = FastAPI()

class InferenceRequest(BaseModel):
    data: list[list[float]]

@app.post("/infer")
def infer(req: InferenceRequest):
    tensor = torch.tensor(req.data, dtype=torch.float32).to(DEVICE)
    result = hybrid_function(tensor)
    return {"result": result.tolist()}
