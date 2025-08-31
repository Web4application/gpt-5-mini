"use client";

import { getHeaders, SpeechOptions } from "../api";
import { OpenaiPath, REQUEST_TIMEOUT_MS } from "@/app/constant";
import { fetchWithTimeout } from "./helpers";

export async function speech(options: SpeechOptions): Promise<ArrayBuffer> {
  const requestPayload = {
    model: options.model,
    input: options.input,
    voice: options.voice,
    response_format: options.response_format,
    speed: options.speed,
  };

  console.log("[Request] openai speech payload: ", requestPayload);

  const controller = new AbortController();
  options.onController?.(controller);

  try {
    const res = await fetchWithTimeout(
      OpenaiPath.SpeechPath,
      {
        method: "POST",
        body: JSON.stringify(requestPayload),
        headers: getHeaders(),
      },
      REQUEST_TIMEOUT_MS,
      controller,
    );

    return await res.arrayBuffer();
  } catch (e) {
    console.log("[Request] failed to make a speech request", e);
    throw e;
  }
}
