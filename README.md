# AI-Powered Appointment Scheduler Backend

## Overview
This backend accepts appointment requests as text or images, runs OCR plus entity extraction with Gemini, normalizes to Asia/Kolkata time, and returns structured JSON with guardrails.

## Architecture
1. Input handling (text JSON or image upload via multipart/form-data)
2. Gemini OCR and entity extraction
3. Normalization to YYYY-MM-DD and HH:MM in Asia/Kolkata
4. Guardrails for ambiguous or missing data

## Setup
1. Install dependencies:
   - `npm install`
2. Configure environment:
   - Update `.env` with your `GEMINI_API_KEY`
   - Optional: set `GEMINI_MODEL` (default: `gemini-flash-latest`)
3. Start the server:
   - `npm start`

The server runs on `http://localhost:3000` by default.

## Ngrok (Public demo URL)
Use ngrok to expose your local server for demos or sharing.

1. Install ngrok from `https://ngrok.com/download` and sign in if prompted.
2. Start the API:
   - `npm start`
3. In a new terminal, run:
   - `ngrok http 3000`
4. Copy the HTTPS forwarding URL (example: `https://abc123.ngrok-free.app`).

Use the ngrok URL in place of `http://localhost:3000` in your curl/Postman requests.

## API
### POST /api/schedule
Accepts either JSON text or an image upload.

#### JSON input
```
{
  "text": "Book dentist next Friday at 3pm"
}
```

#### Multipart input
Key: `image` (file)

### Sample curl requests
Text input:
```bash
curl -X POST http://localhost:3000/api/schedule \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"Book dentist next Friday at 3pm\"}"
```

Image input:
```bash
curl -X POST http://localhost:3000/api/schedule \
  -F "image=@./sample-note.jpg"
```

### Postman quick setup
- Method: POST
- URL: http://localhost:3000/api/schedule
- Body: form-data, key `image` type File (or key `text` type Text)

### Response schema
Success:
```json
{
  "appointment": {
    "department": "Dentistry",
    "date": "2025-09-26",
    "time": "15:00",
    "tz": "Asia/Kolkata",
    "status": "ok"
  },
  "metadata": {
    "raw_text": "Book dentist next Friday at 3pm",
    "confidence": 0.95
  }
}
```

Needs clarification:
```json
{
  "status": "needs clarification",
  "message": "Ambiguous date/time or department",
  "raw_text": "Book sometime next week"
}
```

## Notes
- The service passes the current Asia/Kolkata timestamp to Gemini for relative date resolution.
- Images are processed through the same endpoint using multipart uploads.
- Uploaded files are deleted after processing.
