#!/bin/bash

# Remove old folder if exists
rm -rf ai_prediction_shiny
rm -f ai_prediction_shiny.zip

# Create folder structure
mkdir -p ai_prediction_shiny/data/raw
mkdir -p ai_prediction_shiny/data/processed
mkdir -p ai_prediction_shiny/scripts

# Create dummy lifespan CSV
cat <<EOL > ai_prediction_shiny/data/raw/lifespan.csv
id,age,gender,weight,height,blood_pressure,duration,event,smoker,alcohol,exercise_freq,diabetes,heart_disease,cancer,cholesterol,urban_residence
1,34,M,70,175,120,30,1,0,1,3,0,0,0,180,1
2,58,F,65,160,130,25,1,1,1,1,1,0,0,200,0
3,45,M,80,180,125,35,0,0,0,2,0,1,0,210,1
4,72,F,68,165,140,20,1,0,1,0,1,0,1,190,0
5,50,M,75,178,135,28,0,1,0,2,0,0,0,220,1
EOL

# Create enhanced_ai.R
cat <<EOL > ai_prediction_shiny/scripts/enhanced_ai.R
library(survival)
library(survminer)
library(forecast)
library(dplyr)
library(ggplot2)
library(readr)

predict_lifespan <- function(lifespan_file) {
  lifespan_df <- read_csv(lifespan_file)
  lifespan_df <- lifespan_df %>%
    mutate(
      gender = as.factor(gender),
      event = as.numeric(event),
      bmi = weight / (height/100)^2,
      smoker = as.factor(smoker),
      alcohol = as.factor(alcohol),
      exercise_freq = as.numeric(exercise_freq),
      urban_residence = as.factor(urban_residence)
    )
  cox_model <- coxph(Surv(duration, event) ~ age + gender + bmi + blood_pressure +
                       smoker + alcohol + exercise_freq + diabetes + heart_disease +
                       cancer + cholesterol + urban_residence,
                     data = lifespan_df)
  surv_fit <- survfit(cox_model)
  return(list(model=cox_model, fit=surv_fit, data=lifespan_df))
}

predict_creation <- function() {
  creation_df <- data.frame(
    year = 2000:2020,
    inventions = c(5,7,6,8,10,12,14,13,15,17,19,21,23,22,24,26,27,28,30,31,33),
    tech_index = seq(50, 70, length.out=21),
    gdp = seq(1.2, 2.5, length.out=21),
    startups = c(10,12,15,14,18,20,22,23,25,28,30,32,35,37,39,40,42,44,46,48,50)
  )
  ts_inventions <- ts(creation_df$inventions, start=2000)
  fit_arima <- auto.arima(ts_inventions)
  forecast_inventions <- forecast(fit_arima, h=5)
  return(list(fit=fit_arima, forecast=forecast_inventions))
}
EOL

# Create app.R
cat <<EOL > ai_prediction_shiny/app.R
library(shiny)
library(ggplot2)
library(survminer)
source("scripts/enhanced_ai.R")

ui <- fluidPage(
  titlePanel("AI Prediction Dashboard"),
  sidebarLayout(
    sidebarPanel(
      fileInput("lifespan_file", "Upload Lifespan CSV", accept = c(".csv")),
      actionButton("run_ai", "Run AI Prediction")
    ),
    mainPanel(
      tabsetPanel(
        tabPanel("Lifespan Prediction", plotOutput("surv_plot"), verbatimTextOutput("median_lifespan")),
        tabPanel("Creation Forecast", plotOutput("forecast_plot"), tableOutput("forecast_table")),
        tabPanel("Combined Output", verbatimTextOutput("combined_output"))
      )
    )
  )
)

server <- function(input, output) {
  lifespan_data <- eventReactive(input$run_ai, {
    req(input$lifespan_file)
    predict_lifespan(input$lifespan_file$datapath)
  })
  creation_data <- eventReactive(input$run_ai, {
    predict_creation()
  })
  output$surv_plot <- renderPlot({
    req(lifespan_data())
    ggsurvplot(lifespan_data()$fit, data=lifespan_data()$data, risk.table=TRUE,
               title="Predicted Survival Curve")
  })
  output$median_lifespan <- renderPrint({ req(lifespan_data()); median(lifespan_data()$fit$time) })
  output$forecast_plot <- renderPlot({ req(creation_data()); autoplot(creation_data()$forecast)+ggtitle("Predicted Inventions") })
  output$forecast_table <- renderTable({ req(creation_data()); data.frame(Year=2021:2025, Forecast=as.data.frame(creation_data()$forecast)$`Point Forecast`) })
  output$combined_output <- renderPrint({ req(lifespan_data(), creation_data()); list(median_lifespan=median(lifespan_data()$fit$time), future_inventions=as.data.frame(creation_data()$forecast)$`Point Forecast`) })
}

shinyApp(ui = ui, server = server)
EOL

# Zip everything
zip -r ai_prediction_shiny.zip ai_prediction_shiny

echo "Shiny AI scaffold created and zipped as ai_prediction_shiny.zip!"
```
git clone https://github.com/Web4application/GPT-5-mini.git
cd GPT-5-mini

# Install BFG if not installed
brew install bfg

export OPENAI_API_KEY=sk-yAlzaSyCHjfdo3w160Dd5yTVJD409pWmigOJEg
export OPENAI_API_KEY=sk-AIzaSyAvrxOyAVzPVcnzxuD0mjKVDyS2bNWfC10
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
mkdir gpt5-backend
cd gpt5-backend
npm init -y
npm install express dotenv openai cors

OPENAI_API_KEY=qusDmXVuflS2UgVbtNoxT3BlbkFJdB1IU0OFhSmKkTfBQpAo
PORT=5000
export RUNNER_VERSION=$(curl -X 'GET' https://data.forgejo.org/api/v1/repos/forgejo/runner/releases/latest | jq .name -r | cut -c 2-)

pip install fastapi uvicorn openai
python backend/app.py
docker-compose up --build -d
pip install -r requirements.txt
