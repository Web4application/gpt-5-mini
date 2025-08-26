// backend/fetchJson.js
export async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} from ${url}: ${text.slice(0, 200)}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(`Expected JSON from ${url}, got: ${text.slice(0, 200)}`);
  }

  try {
    return await res.json();
  } catch (err) {
    const text = await res.text();
    throw new Error(`Invalid JSON from ${url}: ${text.slice(0, 200)}`);
  }
}
