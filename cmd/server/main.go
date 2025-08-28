package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
	openai "github.com/openai/openai-go"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"

	_ "net/http/pprof"
)

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

var (
	ctx = context.Background()
	rdb = redis.NewClient(&redis.Options{
		Addr:     os.Getenv("REDIS_ADDR"), // "redis:6379" in Docker
		Password: "",
		DB:       0,
	})
)

func main() {
	http.HandleFunc("/generate", generateHandler)
	http.HandleFunc("/kubu-hai", kubuHandler)

	// Start pprof in background
	go func() {
		log.Println("pprof on :6060")
		log.Println(http.ListenAndServe(":6060", nil))
	}()

	log.Println("Server running on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func generateHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Use POST", http.StatusMethodNotAllowed)
		return
	}

	var input struct {
		SessionID string `json:"session_id"`
		Prompt    string `json:"prompt"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	if input.SessionID == "" {
		http.Error(w, "Missing session_id", http.StatusBadRequest)
		return
	}

	// Style prompt
	caser := cases.Title(language.English)
	userMessage := Message{"user", caser.String(input.Prompt)}

	if err := appendMessage(input.SessionID, userMessage); err != nil {
		http.Error(w, "Failed to store user message", http.StatusInternalServerError)
		return
	}

	history, err := loadHistory(input.SessionID)
	if err != nil {
		http.Error(w, "Failed to load history", http.StatusInternalServerError)
		return
	}

	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		http.Error(w, "Missing OPENAI_API_KEY", http.StatusInternalServerError)
		return
	}

	client := openai.NewClient(apiKey)
	resp, err := client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model:    "gpt-5",
		Messages: convertMessages(history),
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	reply := Message{
		Role:    resp.Choices[0].Message.Role,
		Content: resp.Choices[0].Message.Content,
	}

	if err := appendMessage(input.SessionID, reply); err != nil {
		http.Error(w, "Failed to store reply", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(reply)
}

func kubuHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "Hello from kubu‑hai integration")
}

func appendMessage(sessionID string, msg Message) error {
	data, _ := json.Marshal(msg)
	if err := rdb.RPush(ctx, sessionID, data).Err(); err != nil {
		return err
	}
	return rdb.Expire(ctx, sessionID, 24*time.Hour).Err()
}

func loadHistory(sessionID string) ([]Message, error) {
	raw, err := rdb.LRange(ctx, sessionID, 0, -1).Result()
	if err != nil {
		return nil, err
	}
	msgs := []Message{}
	for _, item := range raw {
		var m Message
		if json.Unmarshal([]byte(item), &m) == nil {
			msgs = append(msgs, m)
		}
	}
	return msgs, nil
}

func convertMessages(msgs []Message) []openai.ChatCompletionMessage {
	oaiMsgs := []openai.ChatCompletionMessage{}
	for _, m := range msgs {
		oaiMsgs = append(oaiMsgs, openai.ChatCompletionMessage{
			Role:    m.Role,
			Content: m.Content,
		})
	}
	return oaiMsgs
}
