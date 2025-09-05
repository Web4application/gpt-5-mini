package main

import (
    "encoding/json"
    "log"
    "net/http"
    "os"

    openai "github.com/openai/openai-go"
)

type ChatRequest struct {
    Message string `json:"message"`
}

type ChatResponse struct {
    Reply string `json:"reply"`
}

func main() {
    apiKey := os.Getenv("OPENAI_API_KEY")
    if apiKey == "" {
        log.Fatal("OPENAI_API_KEY not set")
    }

    client := openai.NewClient(apiKey)

    http.HandleFunc("/api/chat", func(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
            http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
            return
        }

        var req ChatRequest
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            http.Error(w, "Invalid request", http.StatusBadRequest)
            return
        }

        resp, err := client.CreateChatCompletion(r.Context(), openai.ChatCompletionRequest{
            Model: "gpt-4o",
            Messages: []openai.ChatMessage{
                {Role: "user", Content: req.Message},
            },
        })
        if err != nil {
            http.Error(w, "OpenAI error: "+err.Error(), http.StatusInternalServerError)
            return
        }

        reply := resp.Choices[0].Message.Content
        json.NewEncoder(w).Encode(ChatResponse{Reply: reply})
    })

    log.Println("Server running on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
