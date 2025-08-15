'''
# install bfg
bfg --delete-files id_rsa
git reflog expire --expire=now --all
git gc --prune=now --aggressive
# push to origin (force)
git push origin --force --all

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
  AI-webapp/
  gpt-pilot/

# Move gpt-pilot and AI-webapp and web4app4 into QUBUHUB or link them
mv gpt-pilot AI-webapp/gpt-pilot
