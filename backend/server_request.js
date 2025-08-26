// server_request.js
import { fetchJson } from './fetchJson.js';

export async function sendRequest(url, payload = {}) {
  try {
    const data = await fetchJson(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return data;
  } catch (err) {
    console.error(`❌ Failed to send request to ${url}:`, err.message);
    throw err;
  }
}
