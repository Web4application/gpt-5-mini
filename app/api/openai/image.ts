export const image = {
  async generate(prompt: string): Promise<string> {
    // Example: Replace with actual image generation API
    return `https://your-image-api.com/generate?prompt=${encodeURIComponent(prompt)}`;
  }
};
