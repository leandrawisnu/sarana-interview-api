# Sarana Interview API

Express + Gemini API for asking general questions.

## Setup

```bash
npm install
```

## Environment

Buat `.env` file:

```
GEMINI_API_KEY=your_api_key_here
```

Get API key from https://aistudio.google.com/app/apikey

## Run

```bash
npm start
```

Server runs on http://localhost:3000

## API Endpoints

### GET /health

Health check.

**Response:**
```
Healthy
```

### POST /ask

Ask a question (non-streaming).

**Request:**
```json
{
  "question": "What is AI?"
}
```

**Response:**
```json
{
  "answer": "AI is..."
}
```

### POST /ask/stream

Ask a question with streaming response (SSE).

**Request:**
```json
{
  "question": "What is AI?"
}
```

**Response:**
```
data: {"text": "AI is..."}

data: [DONE]
```

## Testing

```bash
# Health
curl http://localhost:3000/health

# Ask
curl -X POST http://localhost:3000/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What is AI?"}'

# Stream
curl -N -X POST http://localhost:3000/ask/stream \
  -H "Content-Type: application/json" \
  -d '{"question":"What is AI?"}'
```