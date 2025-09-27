# GPT-5-mini Example Backend

This is a minimal Express example to provide:
- POST /api/chat — simple JSON response (fallback)
- GET /api/stream — SSE streaming example
- Serves static files from /public

Usage
1. Install:
   ```
   npm install
   ```

2. Put your frontend (index.html, logo.png, favicon.png, etc.) into a directory named `public` in the repo root.

3. Start server (dev):
   ```
   npm run dev
   ```
   or production:
   ```
   npm start
   ```

4. Test:
   - POST:
     ```
     curl -X POST -H "Content-Type: application/json" -d '{"message":"hello"}' http://localhost:8000/api/app
     ```
   - SSE (streaming chunks):
     ```
     curl -N "http://localhost:3000/api/stream?message=hello"
     ```

Notes
- Replace the echo implementation with your preferred model integration (OpenAI, locally hosted model, etc.).
- CORS is enabled for development; tighten it for production.
- The server serves static files from /public. You can put your `index.html` and assets there.
