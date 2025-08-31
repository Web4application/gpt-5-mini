"use client";

export function cloudflareAIGatewayUrl(path: string) {
  if (!path.startsWith("https://")) {
    return `https://ai.cloudflare.com/${path.replace(/^\//, "")}`;
  }
  return path;
}
