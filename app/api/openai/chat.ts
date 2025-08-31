"use client";

import {
  getMessageTextContent,
  isVisionModel,
  isDalle3 as _isDalle3,
  getTimeoutMSByModel,
} from "@/app/utils";
import {
  preProcessImageContent,
  streamWithThink,
} from "@/app/utils/chat";
import {
  getHeaders,
  ChatOptions,
} from "../api";
import { ServiceProvider, ApiPath, OpenaiPath, Azure } from "@/app/constant";
import { useAppConfig, useAccessStore, useChatStore, usePluginStore } from "@/app/store";
import { collectModelsWithDefaultModel } from "@/app/utils/model";
import { fetchWithTimeout, handleToolCalls } from "./helpers";
import { RequestPayload, DalleRequestPayload } from "./types";

function normalizeRequestPayload(
  model: string,
  messages: ChatOptions["messages"],
  modelConfig: any,
  stream?: boolean,
  visionModel?: boolean,
): RequestPayload | DalleRequestPayload {
  const isDalle3 = _isDalle3(model);
  const isO1OrO3 = model.startsWith("o1") || model.startsWith("o3") || model.startsWith("o4-mini");
  const isGpt5 = model.startsWith("gpt-5");

  if (isDalle3) {
    const prompt = getMessageTextContent(messages.slice(-1)?.pop() as any);
    return {
      model,
      prompt,
      response_format: "b64_json",
      n: 1,
      size: modelConfig?.size ?? "1024x1024",
      quality: modelConfig?.quality ?? "standard",
      style: modelConfig?.style ?? "vivid",
    };
  }

  const processedMessages: ChatOptions["messages"] = [];
  for (const v of messages) {
    const content = visionModel ? preProcessImageContent(v.content) : getMessageTextContent(v);
    if (!(isO1OrO3 && v.role === "system")) {
      processedMessages.push({ role: v.role, content });
    }
  }

  const payload: RequestPayload = {
    messages: processedMessages,
    stream,
    model,
    temperature: (!isO1OrO3 && !isGpt5) ? modelConfig.temperature : 1,
    presence_penalty: !isO1OrO3 ? modelConfig.presence_penalty : 0,
    frequency_penalty: !isO1OrO3 ? modelConfig.frequency_penalty : 0,
    top_p: !isO1OrO3 ? modelConfig.top_p : 1,
  };

  if (isGpt5) {
    payload["max_completion_tokens"] = modelConfig.max_tokens;
  } else if (isO1OrO3) {
    payload.messages.unshift({
      role: "developer",
      content: "Formatting re-enabled",
    });
    payload["max_completion_tokens"] = modelConfig.max_tokens;
  } else if (visionModel) {
    payload["max_tokens"] = Math.max(modelConfig.max_tokens, 4000);
  }

  return payload;
}

export async function chat(options: ChatOptions) {
  const modelConfig = {
    ...useAppConfig.getState().modelConfig,
    ...useChatStore.getState().currentSession().mask.modelConfig,
    ...{
      model: options.config.model,
      providerName: options.config.providerName,
    },
  };

  const requestPayload = normalizeRequestPayload(
    modelConfig.model,
    options.messages,
    modelConfig,
    options.config.stream,
    isVisionModel(modelConfig.model),
  );

  const shouldStream = !_isDalle3(modelConfig.model) && !!options.config.stream;
  const controller = new AbortController();
  options.onController?.(controller);

  try {
    let chatPath = "";

    if (modelConfig.providerName === ServiceProvider.Azure) {
      const { models: configModels, customModels: configCustomModels } = useAppConfig.getState();
      const { defaultModel, customModels: accessCustomModels, useCustomConfig } = useAccessStore.getState();
      const models = collectModelsWithDefaultModel(
        configModels,
        [configCustomModels, accessCustomModels].join(","),
        defaultModel,
      );
      const model = models.find(
        m =>
          m.name === modelConfig.model &&
          m?.provider?.providerName === ServiceProvider.Azure,
      );
      chatPath = ( _isDalle3(modelConfig.model) ? Azure.ImagePath : Azure.ChatPath )(
        (model?.displayName ?? model?.name) as string,
        useCustomConfig ? useAccessStore.getState().azureApiVersion : "",
      );
    } else {
      chatPath = _isDalle3(modelConfig.model) ? OpenaiPath.ImagePath : OpenaiPath.ChatPath;
    }

    if (shouldStream) {
      let runTools: any[] = [];
      const [tools, funcs] = usePluginStore
        .getState()
        .getAsTools(useChatStore.getState().currentSession().mask?.plugin || []);

      streamWithThink(
        chatPath,
        requestPayload,
        getHeaders(),
        tools as any,
        funcs,
        controller,
        (text: string, toolsList: any[]) => {
          const json = JSON.parse(text);
          const choices = json.choices as Array<{
            delta: { content: string; tool_calls: any[]; reasoning_content: string | null };
          }>;
          if (!choices?.length) return { isThinking: false, content: "" };

          handleToolCalls(toolsList, choices[0]?.delta?.tool_calls);
          const reasoning = choices[0]?.delta?.reasoning_content;
          const content = choices[0]?.delta?.content;

          if (reasoning?.length) return { isThinking: true, content: reasoning };
          if (content?.length) return { isThinking: false, content };
          return { isThinking: false, content: "" };
        },
        (payload: RequestPayload, toolCallMessage: any, toolCallResult: any[]) => {
          runTools = []; // reset
          payload?.messages?.splice(payload.messages.length, 0, toolCallMessage, ...toolCallResult);
        },
        options,
      );
    } else {
      const res = await fetchWithTimeout(
        chatPath,
        {
          method: "POST",
          body: JSON.stringify(requestPayload),
          headers: getHeaders(),
        },
        getTimeoutMSByModel(modelConfig.model),
        controller,
      );

      const resJson = await res.json();
      options.onFinish(resJson, res);
    }
  } catch (e) {
    console.log("[Request] failed to make a chat request", e);
    options.onError?.(e as Error);
  }
}
