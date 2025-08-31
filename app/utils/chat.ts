"use client";

import { preProcessImageContent } from "./chat";
import { getMessageTextContent, isVisionModel } from "./index";

export async function normalizeRequestPayload(options: any, modelConfig: any) {
  const visionModel = isVisionModel(options.config.model);
  const messages: any[] = [];

  for (const v of options.messages) {
    const content = visionModel
      ? await preProcessImageContent(v.content)
      : getMessageTextContent(v);
    messages.push({ role: v.role, content });
  }

  return {
    messages,
    model: modelConfig.model,
    stream: options.config.stream,
    temperature: modelConfig.temperature,
    presence_penalty: modelConfig.presence_penalty,
    frequency_penalty: modelConfig.frequency_penalty,
    top_p: modelConfig.top_p,
  };
}
