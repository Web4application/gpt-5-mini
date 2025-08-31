"use client";

import {
  ApiPath,
  OPENAI_BASE_URL,
  DEFAULT_MODELS,
  OpenaiPath,
  Azure,
  ServiceProvider,
} from "@/app/constant";

import {
  ChatMessageTool,
  useAccessStore,
  useAppConfig,
  useChatStore,
  usePluginStore,
} from "@/app/store";

import {
  preProcessImageContent,
  uploadImage,
  base64Image2Blob,
  streamWithThink,
} from "@/app/utils/chat";

import { cloudflareAIGatewayUrl } from "@/app/utils/cloudflare";
import { ModelSize, DalleQuality, DalleStyle } from "@/app/typing";

import {
  ChatOptions,
  getHeaders,
  LLMApi,
  LLMModel,
  LLMUsage,
  MultimodalContent,
  SpeechOptions,
} from "../api";

import Locale from "../../locales";
import { getClientConfig } from "@/app/config/client";
import {
  getMessageTextContent,
  isVisionModel,
  isDalle3 as _isDalle3,
  getTimeoutMSByModel,
} from "@/app/utils";

import { fetch } from "@/app/utils/stream";

// ---------- Helpers ----------

async function normalizeRequestPayload(
  model: string,
  messages: RequestPayload["messages"],
  modelConfig: any,
  stream: boolean,
  visionModel: boolean,
): Promise<RequestPayload | DalleRequestPayload> {
  const isDalle3 = _isDalle3(model);
  const isReasoning = model.startsWith("o1") || model.startsWith("o3") || model.startsWith("o4-mini");
  const isGpt5 = model.startsWith("gpt-5");

  if (isDalle3) {
    return {
      model,
      prompt: getMessageTextContent(messages.slice(-1)?.pop() as any),
      response_format: "b64_json",
      n: 1,
      size: modelConfig?.size ?? "1024x1024",
      quality: modelConfig?.quality ?? "standard",
      style: modelConfig?.style ?? "vivid",
    } as DalleRequestPayload;
  }

  const filtered: RequestPayload["messages"] = [];
  for (const v of messages) {
    if (isReasoning && v.role === "system") continue;
    const content = visionModel
      ? await preProcessImageContent(v.content)
      : getMessageTextContent(v);
    filtered.push({ role: v.role, content });
  }

  const payload: RequestPayload = {
    messages: filtered,
    stream,
    model,
    temperature: (!isReasoning && !isGpt5) ? modelConfig.temperature : 1,
    presence_penalty: !isReasoning ? modelConfig.presence_penalty : 0,
    frequency_penalty: !isReasoning ? modelConfig.frequency_penalty : 0,
    top_p: !isReasoning ? modelConfig.top_p : 1,
  };

  if (isGpt5) {
    payload.max_completion_tokens = modelConfig.max_tokens;
  } else if (isReasoning) {
    payload.max_completion_tokens = modelConfig.max_tokens;
    payload.messages.unshift({
      role: "developer",
      content: "Formatting re-enabled",
    });
  } else if (visionModel) {
    payload.max_tokens = Math.max(modelConfig.max_tokens, 4000);
  }

  return payload;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
  controller?: AbortController,
) {
  const aborter = controller ?? new AbortController();
  const id = setTimeout(() => aborter.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: aborter.signal });
  } finally {
    clearTimeout(id);
  }
}

function handleToolCalls(runTools: ChatMessageTool[], toolCalls?: any[]) {
  if (!toolCalls?.length) return;
  for (const call of toolCalls) {
    const { id, type, function: fn } = call;
    if (!id) continue;

    let existing = runTools.find(t => t.id === id);
    if (!existing) {
      existing = {
        id,
        type,
        function: {
          name: fn?.name,
          arguments: fn?.arguments ?? "",
        },
      };
      runTools.push(existing);
    } else {
      existing.function.arguments += fn?.arguments ?? "";
    }
  }
}

// ---------- Interfaces ----------

export interface OpenAIListModelResponse {
  object: string;
  data: Array<{ id: string; object: string; root: string }>;
}

export interface RequestPayload {
  messages: {
    role: "developer" | "system" | "user" | "assistant";
    content: string | MultimodalContent[];
  }[];
  stream?: boolean;
  model: string;
  temperature: number;
  presence_penalty: number;
  frequency_penalty: number;
  top_p: number;
  max_tokens?: number;
  max_completion_tokens?: number;
}

export interface DalleRequestPayload {
  model: string;
  prompt: string;
  response_format: "url" | "b64_json";
  n: number;
  size: ModelSize;
  quality: DalleQuality;
  style: DalleStyle;
}

// ---------- Main API Class ----------

export class ChatGPTApi implements LLMApi {
  private disableListModels = true;

  path(path: string): string {
    const accessStore = useAccessStore.getState();
    let baseUrl = "";
    const isAzure = path.includes("deployments");

    if (accessStore.useCustomConfig) {
      if (isAzure && !accessStore.isValidAzure()) {
        throw Error("Incomplete Azure config, check your settings page.");
      }
      baseUrl = isAzure ? accessStore.azureUrl : accessStore.openaiUrl;
    }

    if (!baseUrl) {
      const isApp = !!getClientConfig()?.isApp;
      baseUrl = isApp ? OPENAI_BASE_URL : (isAzure ? ApiPath.Azure : ApiPath.OpenAI);
    }

    baseUrl = baseUrl.replace(/\/$/, "");
    if (!baseUrl.startsWith("http") && !isAzure && !baseUrl.startsWith(ApiPath.OpenAI)) {
      baseUrl = "https://" + baseUrl;
    }

    return cloudflareAIGatewayUrl([baseUrl, path].join("/"));
  }

  async extractMessage(res: any) {
    if (res.error) return "```\n" + JSON.stringify(res, null, 4) + "\n```";
    if (res.data) {
      let url = res.data?.at(0)?.url ?? "";
      const b64_json = res.data?.at(0)?.b64_json ?? "";
      if (!url && b64_json) url = await uploadImage(base64Image2Blob(b64_json, "image/png"));
      return [{ type: "image_url", image_url: { url } }];
    }
    return res.choices?.at(0)?.message?.content ?? res;
  }

  async speech(options: SpeechOptions): Promise<ArrayBuffer> {
    const payload = {
      model: options.model,
      input: options.input,
      voice: options.voice,
      response_format: options.response_format,
      speed: options.speed,
    };

    const controller = new AbortController();
    options.onController?.(controller);

    const res = await fetchWithTimeout(
      this.path(OpenaiPath.SpeechPath),
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: getHeaders(),
      },
      getTimeoutMSByModel(options.model),
      controller,
    );

    return await res.arrayBuffer();
  }

  async chat(options: ChatOptions) {
    const modelConfig = {
      ...useAppConfig.getState().modelConfig,
      ...useChatStore.getState().currentSession().mask.modelConfig,
      ...{
        model: options.config.model,
        providerName: options.config.providerName,
      },
    };

    const requestPayload = await normalizeRequestPayload(
      modelConfig.model,
      options.messages,
      modelConfig,
      options.config.stream,
      isVisionModel(modelConfig.model),
    );

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
          m => m.name === modelConfig.model && m?.provider?.providerName === ServiceProvider.Azure,
        );
        chatPath = this.path(
          (_isDalle3(modelConfig.model) ? Azure.ImagePath : Azure.ChatPath)(
            model?.displayName ?? model?.name,
            useCustomConfig ? useAccessStore.getState().azureApiVersion : "",
          ),
        );
      } else {
        chatPath = this.path(_isDalle3(modelConfig.model) ? OpenaiPath.ImagePath : OpenaiPath.ChatPath);
      }

      if (options.config.stream) {
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
          (text: string, runTools: ChatMessageTool[]) => {
            const json = JSON.parse(text);
            const choices = json.choices as Array<{ delta: { content: string; tool_calls: ChatMessageTool[]; reasoning_content: string | null } }>;
            if (!choices?.length) return { isThinking: false, content: "" };

            handleToolCalls(runTools, choices[0]?.delta?.tool_calls);

            const reasoning = choices[0]?.delta?.reasoning_content;
            const content = choices[0]?.delta?.content;
            if (reasoning?.length) return { isThinking: true, content: reasoning };
            if (content?.length) return { isThinking: false, content };
            return { isThinking: false, content: "" };
          },
          (payload: RequestPayload, toolCallMessage: any, toolCallResult: any[]) => {
            payload?.messages?.splice(payload?.messages?.length, 0, toolCallMessage, ...toolCallResult);
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
        const message = await this.extractMessage(resJson);
        options.onFinish(message, res);
      }
    } catch (e) {
      options.onError?.(e as Error);
    }
  }

  async usage(): Promise<LLMUsage> {
    const formatDate = (d: Date) =>
      `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
        .getDate()
        .toString()
        .padStart(2, "0")}`;

    const ONE_DAY = 24 * 60 * 60 * 1000;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const startDate = formatDate(startOfMonth);
    const endDate = formatDate(new Date(Date.now() + ONE_DAY));

    const [used, subs] = await Promise.all([
      fetch(this.path(`${OpenaiPath.UsagePath}?start_date=${startDate}&end_date=${endDate}`), {
        method: "GET",
        headers: getHeaders(),
      }),
      fetch(this.path(OpenaiPath.SubsPath), {
        method: "GET",
        headers: getHeaders(),
      }),
    ]);

    if (used.status === 401) throw new Error(Locale.Error.Unauthorized);
    if (!used.ok || !subs.ok) throw new Error("Failed to query usage from OpenAI API");

    const usageJson = await used.json();
    const subsJson = await subs.json();

    if (usageJson?.error?.message) throw Error(usageJson.error.message);

    return {
      used: usageJson.total_usage ? Math.round(usageJson.total_usage) / 100 : undefined,
      total: subsJson.hard_limit_usd ? Math.round(subsJson.hard_limit_usd * 100) / 100 : undefined,
    };
  }

  async models(): Promise<LLMModel[]> {
    if (this.disableListModels) return DEFAULT_MODELS.slice();

    const res = await fetch(this.path(OpenaiPath.ListModelPath), {
      method: "GET",
      headers: { ...getHeaders() },
    });

    if (!res.ok) return [];

    const resJson = (await res.json()) as OpenAIListModelResponse;
    const chatModels = resJson.data?.filter(
      m =>
        m.id.startsWith("gpt-") ||
        m.id.startsWith("chatgpt-") ||
        m.id.startsWith("o1") ||
        m.id.startsWith("o3") ||
        m.id.startsWith("o4-mini"),
    );

    let seq = 1000;
    return (chatModels ?? []).map(m => ({
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
}

export { OpenaiPath };
