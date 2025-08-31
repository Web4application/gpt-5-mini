"use client";

export async function fetch(input: RequestInfo | URL, init?: RequestInit) {
  return globalThis.fetch(input, init);
}

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
  // SSE / streaming logic
}
