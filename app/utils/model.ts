"use client";

export function isVisionModel(name: string) {
  return name.includes("vision");
}

export function isDalle3(name: string) {
  return name.startsWith("dall-e-3");
}

export function getTimeoutMSByModel(name: string) {
  if (name.startsWith("o1") || name.startsWith("o3")) return 60000;
  return 30000;
}
