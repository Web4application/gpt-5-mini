#!/usr/bin/env bash
set -e
ROOT="$(pwd)"
GP="./gpt-pilot"

if [ ! -d "$GP" ]; then
  echo "Error: $GP not found. Run this from project root where gpt-pilot exists."
  exit 1
fi

echo "📦 Installing openai + axios in gpt-pilot..."
cd "$GP"
npm install openai axios --no-audit --no-fund

echo "🛠 Creating src/chatgpt-5.js..."
mkdir -p src

cat > src/gpt5.js <<'JS'
/**
 * GPT-5 integration route
 * POST /api/chatgpt-5
 * Body: { prompt: string, max_tokens?: number, temperature?: number, verbosity?: string }
 */
import express from "express";
import OpenAI from "openai";

const router = express.Router();
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post("/api/chatgpt-5", async (req, res) => {
  try {
    const { prompt, max_tokens = 800, temperature = 0.2, verbosity } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const response = await client.responses.create({
      model: "chatgpt-5",
      input: prompt,
      max_output_tokens: Number(max_tokens),
      temperature: Number(temperature),
      ...(verbosity ? { verbosity } : {})
    });

    // Try to normalize typical Responses API shape
    let out = response;
    try {
      if (response.output && Array.isArray(response.output)) {
        const first = response.output[0];
        if (first && Array.isArray(first.content)) {
          out = first.content.map(c => (c.text ? c.text : c)).join("\n");
        }
      }
    } catch (e) {
      // fallback to sending full response
    }

    res.json({ ok: true, response: out, raw: response });
  } catch (err) {
    console.error("gpt5 error:", err?.message ?? err);
    res.status(500).json({ error: err?.message ?? String(err) });
  }
});

export default router;
JS

echo "🔌 Attempting to auto-wire the route into common entry files..."
cd "$ROOT/$GP"

# list of possible entry files
FILES=("app.js" "server.js" "index.js" "src/app.js" "src/index.js" "src/server.js")
INJECT_IMPORT="import gpt5Router from './src/gpt5.js';"
INJECT_USE="app.use(gpt5Router);"

FOUND=false
for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    FOUND=true
    # Only add import if not present
    if ! grep -q "gpt5.js" "$f"; then
      echo "✍️ Patching $f with import and route hook..."
      # insert import after first import block or at top
      awk -v imp="$INJECT_IMPORT" -v use="$INJECT_USE" '
        NR==1{print; next}
        {print}
      ' "$f" > "$f.tmp" && mv "$f.tmp" "$f"

      # naive append of use() near end of file (after the last app.use or before listen)
      if grep -q "app.listen" "$f"; then
        awk -v use="$INJECT_USE" '
        {print}
        /app.listen/ && !x { print use; x=1 }
        ' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
      else
        # append at end
        echo "" >> "$f"
        echo "$INJECT_USE" >> "$f"
      fi

      # Add the import at top cleanly (prepend)
      sed -i "1s;^;$INJECT_IMPORT\n;" "$f"
    else
      echo "ℹ️ $f already mentions gpt5 — skipping patch."
    fi
    break
  fi
done

if [ "$FOUND" = false ]; then
  echo "⚠️ Could not find typical entry files to auto-wire (app.js/index.js/server.js)."
  echo "  Manual step: import the router and use it in your express app:"
  echo ""
  echo "  import gpt5Router from './src/gpt5.js';"
  echo "  app.use(gpt5Router);"
fi

echo "📝 Creating .env.example at project root..."
cd "$ROOT"
cat > .env.example <<ENV
# Example env - NEVER commit real API keys
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
ENV

echo "🔁 Updating docker-compose.yml to include OPENAI_API_KEY for gpt-pilot..."
DC="./docker-compose.yml"
if [ -f "$DC" ]; then
  if grep -q "gpt-pilot:" "$DC"; then
    # insert env var under gpt-pilot service
    awk '
      BEGIN{in_service=0}
      {
        print;
        if ($0 ~ /^[[:space:]]*gpt-pilot:/) { in_service=1; next }
        if (in_service && $0 ~ /^[[:space:]]*restart:/) { # locate restart or next key to insert before
          print "    environment:"
          print "      - OPENAI_API_KEY=${OPENAI_API_KEY}"
          in_service=0
        }
      }
    ' "$DC" > "$DC.tmp" && mv "$DC.tmp" "$DC"
    echo "✅ docker-compose.yml patched (best-effort). Verify the gpt-pilot service block."
  else
    echo "⚠️ docker-compose.yml exists but no gpt-pilot service found. Manual update recommended."
  fi
else
  echo "⚠️ No docker-compose.yml at project root. Skipping compose patch."
fi

echo "✅ Patch completed. Quick checklist:"
echo "- Add real API key into .env (or Docker secret): OPENAI_API_KEY=sk-..."
echo "- Rebuild if using Docker: docker compose up --build -d"
echo "- Local test: curl -X POST http://localhost:4000/api/gpt5 -H 'Content-Type: application/json' -d '{\"prompt\":\"hello\"}'"
echo ""
echo "If the app entrypoint is non-standard, open the file where Express is created and add:"
echo "  import gpt5Router from './src/gpt5.js';"
echo "  app.use(gpt5Router);"

exit 0
c
# add your API key to .env
cp .env.example .env
# edit .env -> set OPENAI_API_KEY
docker compose up --build -d

cd gpt-pilot
export OPENAI_API_KEY="sk-xxxx"    # or source .env
npm start
# then:
curl -s -X POST http://localhost:4000/api/chatgpt-5 \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Say hi in an epic poetic line","max_tokens":50}'

  

chmod +x patch_gpt5.sh
./chatgpt-5.sh
