// getToken.js
import { fetchJson } from './fetchJson.js';

export async function getToken(tokenUrl, headers = {}) {
  try {
    const tokenData = await fetchJson(tokenUrl, {
      method: 'POST',
      headers
    });
    return tokenData;
  } catch (err) {
    console.error(`❌ Failed to get token from ${tokenUrl}:`, err.message);
    throw err;
  }
}
