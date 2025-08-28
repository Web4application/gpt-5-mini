import nock from "nock";
import fetch from "node-fetch";
import assert from "assert";

const baseUrl = "https://api.openai.com";
const path = "/v1/chat/completions";
const expectedBody = {
  model: "gpt-5",
  messages: [{ role: "user", content: "Hello?" }],
};

// ✅ Success mock
nock(baseUrl)
  .post(path, (body) => {
    assert.deepStrictEqual(body, expectedBody); // verify payload
    return true;
  })
  .reply(200, {
    choices: [{ message: { content: "Mocked AI reply ✅" } }],
  });

// ❌ Error mock
nock(baseUrl)
  .post(path, expectedBody)
  .reply(500, {
    error: { message: "Internal server error" },
  });

// --- Test success scenario ---
(async () => {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer fake-key" },
    body: JSON.stringify(expectedBody),
  });

  const data = await res.json();
  assert.strictEqual(data.choices[0].message.content, "Mocked AI reply ✅");
  console.log("✅ Success scenario passed");
})();

// --- Test failure scenario ---
(async () => {
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer fake-key" },
      body: JSON.stringify(expectedBody),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error.message);
    }

    console.error("❌ Expected failure but got success");
  } catch (err) {
    assert.strictEqual(err.message, "Internal server error");
    console.log("✅ Error scenario passed:", err.message);
  }
})();
