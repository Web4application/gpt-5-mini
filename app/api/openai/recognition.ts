export const recognition = {
  async detectIntent(audioBlob: Blob): Promise<string> {
    // Step 1: Transcribe using Google Speech-to-Text
    // Step 2: Analyze transcript for intent (custom logic or ML model)

    // Placeholder: You’d typically send audio to Google, get transcript,
    // then run NLP intent detection on the result.
    return "Intent: ask_weather";
  }
};
