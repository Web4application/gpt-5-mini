import { fetch } from "@/app/utils/stream";

export async function fetchWithTimeout(
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

export function handleToolCalls(runTools: any[], toolCalls?: any[]) {
  if (!toolCalls?.length) return;
  for (const call of toolCalls) {
    const { id, type, function: fn } = call;
    if (!id) continue;

    let existing = runTools.find(t => t.id === id);
    if (!existing) {
      runTools.push({
        id,
        type,
        function: { name: fn?.name, arguments: fn?.arguments ?? "" },
      });
    } else {
      existing.function.arguments += fn?.arguments ?? "";
    }
  }
}
