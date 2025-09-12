"use client";

import { chat } from "./chat";
import { speech } from "./speech";
import { usage } from "./usage";
import { models } from "./models";

import { image } from "./image";
import { translate } from "./translate";
import { speechToText } from "./speechToText";
import { textToSpeech } from "./textToSpeech";
import { recognition } from "./recognition";

import {
  LLMApi,
  ChatOptions,
  SpeechOptions,
  LLMUsage,
  LLMModel,
  ImageOptions,
  TranslateOptions,
  SpeechToTextOptions,
  TextToSpeechOptions,
  RecognitionOptions
} from "../api";

export class ChatGPTApi implements LLMApi {
  chat = chat;
  speech = speech;
  usage = usage;
  models = models;
  image = image;
  translate = translate;
  speechToText = speechToText;
  textToSpeech = textToSpeech;
  recognition = recognition;
}

export {
  chat,
  speech,
  usage,
  models,
  image,
  translate,
  speechToText,
  textToSpeech,
  recognition
};
