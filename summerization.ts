export interface Env {
  AI: Ai;
  CACHE: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const { input_text, max_length = 50, language = "auto", url } = await request.json();

      let textToSummarize = input_text;

      // 1️⃣ Fetch content from URL if provided
      if (url) {
        const res = await fetch(url);
        textToSummarize = await res.text();
      }

      if (!textToSummarize || typeof textToSummarize !== "string") {
        return new Response("Missing or invalid input_text or URL content", { status: 400 });
      }

      // 2️⃣ Check cache
      const cacheKey = `summary:${url || input_text}:${max_length}`;
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        return new Response(cached, { headers: { "X-Cache": "HIT" } });
      }

      // 3️⃣ Detect language (sample first 500 chars) with fallback
      let detectedLang = language;
      if (language === "auto") {
        try {
          const sample = textToSummarize.slice(0, 500);
          const detection = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
            prompt: `Detect the ISO 639-1 language code for the following text:\n\n${sample}\n\nOnly return the code.`,
            max_tokens: 5
          });
          detectedLang = (detection.output_text || "en").trim().toLowerCase();
        } catch {
          detectedLang = "en";
        }
      }

      // 4️⃣ Choose summarization model
      const model = detectedLang === "en"
        ? "@cf/facebook/bart-large-cnn"
        : "@cf/facebook/mbart-large-50";

      // 5️⃣ Prepare streaming encoder
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const paragraphs = textToSummarize
              .split(/\n+/)
              .filter(p => p.trim().length > 0);

            controller.enqueue(encoder.encode(`{"model_used":"${model}","detected_language":"${detectedLang}","summaries":[`));

            for (let i = 0; i < paragraphs.length; i++) {
              const paragraph = paragraphs[i];
              const result = await env.AI.run(model, {
                input_text: paragraph,
                max_length
              });

              controller.enqueue(encoder.encode(JSON.stringify(result)));
              if (i < paragraphs.length - 1) {
                controller.enqueue(encoder.encode(","));
              }
            }

            controller.enqueue(encoder.encode(`],"paragraph_count":${paragraphs.length}}`));
            controller.close();
          } catch (err) {
            controller.error(err);
          }
        }
      });

      // 6️⃣ Cache the full result (non-streamed copy)
      const paragraphs = textToSummarize.split(/\n+/).filter(p => p.trim().length > 0);
      const summaries = [];
      for (const paragraph of paragraphs) {
        const result = await env.AI.run(model, {
          input_text: paragraph,
          max_length
        });
        summaries.push(result);
      }
      const responseBody = JSON.stringify({
        summaries,
        model_used: model,
        detected_language: detectedLang,
        paragraph_count: summaries.length,
        source: url ? "url" : "text"
      });
      await env.CACHE.put(cacheKey, responseBody, { expirationTtl: 3600 });

      return new Response(stream, {
        headers: {
          "Content-Type": "application/json",
          "X-Cache": "MISS",
          "Transfer-Encoding": "chunked"
        }
      });

    } catch (error) {
      return new Response(`Error: ${error}`, { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
