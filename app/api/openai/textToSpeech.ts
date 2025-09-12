export const textToSpeech = {
  async synthesize(text: string, voiceId: string = "EXAVITQu4vr4xnSDxMaL"): Promise<Blob> {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": "YOUR_ELEVENLABS_API_KEY",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });

    const audioBuffer = await response.arrayBuffer();
    return new Blob([audioBuffer], { type: "audio/mpeg" });
  }
};
