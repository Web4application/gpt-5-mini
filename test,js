import nock from "nock";
import fetch from "node-fetch";
import assert from "assert";

// Mock OpenAI endpoint
nock("https://api.openai.com")
  .post("/v1/chat/completions")
  .reply(200, {
    choices: [{ message: { content: "Mocked AI reply ✅" } }],
  });

// Example test
(async () => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer fake-key" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Hello?" }],
    }),
  });

  const data = await response.json();
  assert.equal(data.choices[0].message.content, "Mocked AI reply ✅");

  console.log("✅ Test passed:", data.choices[0].message.content);
})();
