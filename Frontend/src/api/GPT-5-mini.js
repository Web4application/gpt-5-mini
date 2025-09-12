import axios from "axios";

const BASE_URL = "http://localhost:5000/api"; // Update to match your backend

export const chat = (message) => axios.post(`${BASE_URL}/chat`, { message });
export const generateImage = (prompt) => axios.post(`${BASE_URL}/image`, { prompt });
export const translateText = (text, targetLang) => axios.post(`${BASE_URL}/translate`, { text, targetLang });
export const transcribeAudio = (audioBlob) => axios.post(`${BASE_URL}/speech-to-text`, audioBlob);
export const synthesizeSpeech = (text) => axios.post(`${BASE_URL}/text-to-speech`, { text });
export const detectIntent = (audioBlob) => axios.post(`${BASE_URL}/recognition`, audioBlob);
