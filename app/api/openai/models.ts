"use client";

import { getHeaders, LLMModel } from "../api";
import { DEFAULT_MODELS, OpenaiPath } from "@/app/constant";
import { fetch } from "@/app/utils/stream";

interface OpenAIListModelResponse {
  object: string;
  data: Array<{ id: string; object: string; root: string }>;
}

let disableListModels = true;

export async function models(): Promise<LLMModel[]> {
  if (disableListModels) {
    return DEFAULT_MODELS.slice();
  }

  const res = await fetch(OpenaiPath.ListModelPath, {
    method: "GET",
    headers: getHeaders(),
  });

  const resJson = (await res.json()) as OpenAIListModelResponse;
  const chatModels = resJson.data?.filter(
    m => m.id.startsWith("gpt-") || m.id.startsWith("chatgpt-"),
  );

  if (!chatModels) return [];

  let seq = 1000; // same ordering as Constant.ts
  return chatModels.map(m => ({
    name: m.id,
    available: true,
    sorted: seq++,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
      sorted: 1,
    },
  }));
}
