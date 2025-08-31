"use client";

/**
 * Thin wrapper over global fetch.
 * Lets you swap this out if needed (Cloudflare Worker, Node polyfill, etc.).
 */
export async function fetch(input: RequestInfo | URL, init?: RequestInit) {
  return globalThis.fetch(input, init);
}

/**
 * Stream response handler with reasoning + tool-call support.
 */
export async function streamWithThink(
  url: string,
  body: any,
  headers: HeadersInit,
  tools: any[],
  funcs: Record<string, any>,
  controller: AbortController,
  onParse: (
    text: string,
    runTools: any[],
  ) => { isThinking: boolean; content: string },
  onTool: (
    requestPayload: any,
    toolCallMessage: any,
    toolCallResult: any[],
  ) => void,
  options: {
    onMessage?: (msg: string) => void;
    onFinish?: (msg: any, res: Response) => void;
    onError?: (err: Error) => void;
  },
) {
  try {
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers,
      signal: controller.signal,
    });

    if (!res.body) {
      throw new Error("No response body for stream");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    const runTools: any[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true }).trim();
      if (!chunk) continue;

      // parse SSE lines
      const lines = chunk.split("\n").filter(l => l.startsWith("data:"));
      for (const line of lines) {
        const data = line.replace(/^data:\s*/, "");
        if (data === "[DONE]") {
          options.onFinish?.("", res);
          return;
        }

        try {
          const parsed = onParse(data, runTools);

          if (parsed.isThinking) {
            options.onMessage?.(parsed.content);
          } else if (parsed.content) {
            options.onMessage?.(parsed.content);
          }
        } catch (err) {
          console.warn("[streamWithThink] parse error", err);
        }
      }
    }
  } catch (err) {
    console.error("[streamWithThink] stream failed", err);
    options.onError?.(err as Error);
  }
}
