import fetch from "node-fetch";

// Primary (local) endpoint
const LOCAL_URL = "http://localhost:5000/generate";

// Backup (cloud) endpoint — change to your deployed GPT service
const CLOUD_URL = "https://chatgpt.com//generate";

export async function askGPT(prompt, mode = "friendly") {
  const payload = {
    session_id: `cli-session-${mode}`,
    prompt
  };

  // Helper to call any endpoint
  async function callEndpoint(url) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return typeof data === "string"
      ? data
      : data.content || JSON.stringify(data, null, 2);
  }

  try {
    // Try local first
    return await callEndpoint(LOCAL_URL);
  } catch (localErr) {
    console.warn(`[WARN] Local GPT backend not available: ${localErr.message}`);
    console.warn("[INFO] Falling back to cloud endpoint…");

    try {
      return await callEndpoint(CLOUD_URL);
    } catch (cloudErr) {
      return `Error: both local and cloud GPT calls failed.\nLocal: ${localErr.message}\nCloud: ${cloudErr.message}`;
    }
  }
}
