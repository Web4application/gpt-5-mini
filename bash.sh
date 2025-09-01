# Install BFG if not installed
brew install bfg

# Remove all instances of the old key from history
bfg --replace-text <(printf '%s\n' 'ZK1XXchhqBKOltJ87RMqghmUVI_M4qL-bZxuXA05f1A==[REDACTED]')

git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all

git clone https://github.com/Web4application/GPT-5-mini.git
cd GPT-5-mini
mkdir -p .github/workflows
git clone https://github.com/Pythagora-io/gpt-pilot.git
cd gpt-pilot
python -m venv venv
venv\Scripts\activate
source venv/bin/activate
pip install -r requirements.txt
cp example-config.json config.json
python main.py


# install bfg
bfg --delete-files id_rsa
git reflog expire --expire=now --all
git gc --prune=now --aggressive
# push to origin (force)
git push origin --force --all

git add .
git commit -m "Add CI/CD pipeline with Vercel deployment and cleanup"
git push origin main

/web
  package.json
  next.config.js
  /pages
    index.js
    /api
      auth.js
/backend
  Dockerfile
  requirements.txt
  app/main.py
  app/auth.py
  app/models_proxy.py
docker-compose.yml
.github/workflows/ci.yml
.env.example
README.md

git add .
git commit -m "Added files from phone"
git push origin main

# Clone the AI-webapp repo
git clone https://github.com/QUBUHUB/web4.git AI-webapp

# Clone the GPT-pilot repo
git clone https://github.com/QUBUHUB/web4app4.git gpt-pilot

# Download the AI-webapp-main.zip
curl -L -o AI-webapp-main.zip \
  https://github.com/QUBUHUB/web4/files/14301670/AI-webapp-main.zip

# Download the gpt-pilot-main.zip
curl -L -o gpt-pilot-main.zip \
  https://github.com/QUBUHUB/web4/files/14301672/gpt-pilot-main.zip

# Unzip both into your project folder
unzip AI-webapp-main.zip -d AI-webapp
unzip gpt-pilot-main.zip -d gpt-pilot

# Example structure
my-project/
 /web
  package.json
  next.config.js
  /pages
    index.js
    /api
      auth.js
/backend
  Dockerfile
  requirements.txt
  app/main.py
  app/auth.py
  app/models_proxy.py
docker-compose.yml
.github/workflows/ci.yml
.env.example
README.md

# Move gpt-pilot and AI-webapp and web4app4 into QUBUHUB or link them
mv gpt-pilot AI-webapp/gpt-pilot

chmod +x setup.sh
./setup.sh

chmod +x setup.sh
./setup.sh
docker compose up --buildchmod +x setup.sh
./setup.sh

chmod +x setup.sh
./setup.sh
docker compose up --build

%pip install --upgrade "openai>=1.88" "openai-agents>=0.0.19"

cd path/to/your/project
python -m venv myenv
myenv\Scripts\activate
source myenv/bin/activate
pip install -r requirements.txt

npm install express body-parser uuid

curl -X POST http://localhost:8080/generate \
  -H "Content-Type: application/json" \
  -d '{"session_id":"abc123", "prompt":"Hello Ogun State"}'

go mod init github.com/seriki/my-gpt-chat
go mod tidy

docker compose up --build

npm install @supabase/supabase-js

