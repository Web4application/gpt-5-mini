"use client";

import { chat } from "./chat";
import { speech } from "./speech";
import { usage } from "./usage";
import { models } from "./models";

import { LLMApi, ChatOptions, SpeechOptions, LLMUsage, LLMModel } from "../api";

export class ChatGPTApi implements LLMApi {
  chat = chat;
  speech = speech;
  usage = usage;
  models = models;
}

export { chat, speech, usage, models };
