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
