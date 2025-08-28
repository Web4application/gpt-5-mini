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
	"golang.org/x/sync/errgroup"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"

	_ "net/http/pprof"
)

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type RequestBody struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
}

var (
	ctx       = context.Background()
	redisAddr = "localhost:6379" // or your cloud endpoint
	rdb       = redis.NewClient(&redis.Options{
		Addr:     redisAddr,
		Password: "", // set if needed
		DB:       0,
	})
)

func main() {
	// Start pprof
	go func() {
		log.Println("pprof server on :8080")
		log.Println(http.ListenAndServe(":8080", nil))
	}()

	http.HandleFunc("/chat", chatHandler)

	log.Println("Chat server running on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func chatHandler(w http.ResponseWriter, r *http.Request) {
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

	// Title‑case the prompt
	caser := cases.Title(language.English)
	userMessage := Message{Role: "user", Content: caser.String(input.Prompt)}

	// Append user message to Redis list
	if err := appendMessage(input.SessionID, userMessage); err != nil {
		http.Error(w, "Failed to store message", http.StatusInternalServerError)
		return
	}

	// Fetch full conversation from Redis
	contextMessages, err := loadHistory(input.SessionID)
	if err != nil {
		http.Error(w, "Failed to load history", http.StatusInternalServerError)
		return
	}

	// Prepare GPT request
	reqBody := RequestBody{
		Model:    "gpt-5",
		Messages: contextMessages,
	}
	payload, _ := json.Marshal(reqBody)

	var g errgroup.Group
	var aiResp struct {
		Choices []struct {
			Message Message `json:"message"`
		} `json:"choices"`
	}

	g.Go(func() error {
		client := &http.Client{Timeout: 15 * time.Second}
		req, _ := http.NewRequest("POST",
			"https://api.openai.com/v1/chat/completions",
			bytes.NewBuffer(payload))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+os.Getenv("OPENAI_API_KEY"))

		res, err := client.Do(req)
		if err != nil {
			return err
		}
		defer res.Body.Close()
		return json.NewDecoder(res.Body).Decode(&aiResp)
	})

	if err := g.Wait(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Append AI reply
	if err := appendMessage(input.SessionID, aiResp.Choices[0].Message); err != nil {
		http.Error(w, "Failed to store reply", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(aiResp)
}

func appendMessage(sessionID string, msg Message) error {
	data, _ := json.Marshal(msg)
	if err := rdb.RPush(ctx, sessionID, data).Err(); err != nil {
		return err
	}
	// Optional: set expiry so old chats fade out
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
		if err := json.Unmarshal([]byte(item), &m); err == nil {
			msgs = append(msgs, m)
		}
	}
	return msgs, nil
}
