curl -L https://fly.io/install.sh | sh
flyctl auth login
flyctl launch
flyctl auth login
flyctl launch
flyctl secrets set OPENAI_API_KEY=sk-xxx REDIS_ADDR=...
