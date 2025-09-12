export const translate = {
  async text(input: string, targetLang: string): Promise<string> {
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=YOUR_GOOGLE_API_KEY`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: input,
        target: targetLang,
        format: "text"
      })
    });

    const data = await response.json();
    return data.data.translations[0].translatedText;
  }
};
