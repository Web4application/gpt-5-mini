export const textToSpeech = {
  async synthesize(text: string, voice: string = "default"): Promise<Blob> {
    // Example: Replace with actual TTS API
    const audioContent = `Audio for: ${text}`;
    return new Blob([audioContent], { type: "audio/wav" });
  }
};
