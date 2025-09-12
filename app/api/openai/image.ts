export const image = {
  async generate(prompt: string): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer YOUR_OPENAI_API_KEY`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        n: 1,
        size: "1024x1024"
      })
    });

    const data = await response.json();
    return data.data[0].url;
  }
};
