"use client";

import { getHeaders, LLMUsage } from "../api";
import { OpenaiPath } from "@/app/constant";
import Locale from "../../locales";
import { fetch } from "@/app/utils/stream";

function formatDate(d: Date) {
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
    .getDate()
    .toString()
    .padStart(2, "0")}`;
}

export async function usage(): Promise<LLMUsage> {
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startDate = formatDate(startOfMonth);
  const endDate = formatDate(new Date(Date.now() + ONE_DAY));

  const [used, subs] = await Promise.all([
    fetch(
      `${OpenaiPath.UsagePath}?start_date=${startDate}&end_date=${endDate}`,
      { method: "GET", headers: getHeaders() },
    ),
    fetch(OpenaiPath.SubsPath, { method: "GET", headers: getHeaders() }),
  ]);

  if (used.status === 401) {
    throw new Error(Locale.Error.Unauthorized);
  }
  if (!used.ok || !subs.ok) {
    throw new Error("Failed to query usage from openai");
  }

  const response = (await used.json()) as { total_usage?: number; error?: { type: string; message: string } };
  const total = (await subs.json()) as { hard_limit_usd?: number };

  if (response.error?.type) throw Error(response.error.message);
  if (response.total_usage) response.total_usage = Math.round(response.total_usage) / 100;
  if (total.hard_limit_usd) total.hard_limit_usd = Math.round(total.hard_limit_usd * 100) / 100;

  return { used: response.total_usage, total: total.hard_limit_usd };
}
