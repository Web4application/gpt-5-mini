# 🛠 Available Tools

## getWeather
- **Description:** Fetch current weather for a city
- **Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "location": { "type": "string", "description": "City name" }
  },
  "required": ["location"]
}
