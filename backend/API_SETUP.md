# API Key Setup & Verification Guide

## Quick Setup

1. **Copy the example environment file:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edit `.env` and add your API key:**
   ```bash
   # Option 1: Use MiniMax (Recommended)
   MINIMAX_API_KEY=your_actual_minimax_key_here
   
   # Option 2: Use Anthropic (Alternative)
   ANTHROPIC_API_KEY=your_actual_anthropic_key_here
   ```

3. **Start the backend server:**
   ```bash
   node app.js
   ```

## Verification Steps

### 1. Check Server Startup
When you start the server, you should see:
```
API listening on 5174
```

### 2. Test Health Endpoint
```bash
curl http://localhost:5174/health
```
Expected response:
```json
{"ok":true}
```

### 3. Test AI-Powered Task Creation

**First, create a session (login):**
```bash
curl -X POST http://localhost:5174/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user"}'
```

**Then create a task with AI subtask generation:**
```bash
curl -X POST http://localhost:5174/api/tasks \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=YOUR_SESSION_ID_FROM_LOGIN" \
  -d '{"title":"Study calculus for final exam"}'
```

**Expected response (if API key is working):**
```json
{
  "ok": true,
  "data": {
    "id": "...",
    "description": "Study calculus for final exam",
    "subtasks": [
      "Review derivative rules and practice problems",
      "Study integration techniques",
      "Work through past exam questions",
      "Create summary notes for key formulas"
    ],
    "createdAt": "..."
  }
}
```

**If API key is missing or invalid:**
```json
{
  "ok": true,
  "data": {
    "id": "...",
    "description": "Study calculus for final exam",
    "subtasks": [],
    "createdAt": "..."
  }
}
```
Note: Task creation still works, but `subtasks` will be empty.

## Troubleshooting

### Issue: Empty subtasks array

**Possible causes:**
1. ❌ No API key set in `.env`
2. ❌ Invalid API key
3. ❌ API rate limit exceeded
4. ❌ Network connectivity issues

**Check the console output:**
- The server logs will show if the API call failed
- Look for error messages related to "missing_key", "request_failed", or "empty_response"

### Issue: Server won't start

**Check:**
1. Port 5174 is not already in use
2. `.env` file exists in the `backend` folder
3. No syntax errors in `.env` file

### Issue: API calls timing out

**Check:**
1. Your API key has sufficient credits/quota
2. The API base URL is correct
3. Your network allows outbound HTTPS connections

## API Key Priority

The system checks for API keys in this order:

1. **Anthropic** (if `ANTHROPIC_API_KEY` is set and valid)
   - Uses Anthropic Claude models
   - Falls back to Python SDK if `USE_PYTHON_ANTHROPIC=true`

2. **MiniMax** (fallback)
   - Uses MiniMax LLM models
   - Checks both `MINIMAX_API_KEY` and `MINIMAX_KEY`

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MINIMAX_API_KEY` | One of the API keys | `""` | MiniMax API authentication key |
| `ANTHROPIC_API_KEY` | One of the API keys | `""` | Anthropic API authentication key |
| `MINIMAX_BASE_URL` | No | `https://api.minimax.io` | MiniMax API endpoint |
| `ANTHROPIC_BASE_URL` | No | `https://api.minimax.io/anthropic` | Anthropic API endpoint |
| `MINIMAX_MODEL` | No | `MiniMax-M2.5` | Model to use for MiniMax |
| `ANTHROPIC_MODEL` | No | `MiniMax-M2.5` | Model to use for Anthropic |
| `USE_PYTHON_ANTHROPIC` | No | `false` | Use Python SDK for Anthropic calls |
| `PYTHON_PATH` | No | `python3` | Path to Python executable |

## Features Using API Keys

The following features require a valid API key:

1. **AI Task Splitting** (`POST /api/tasks`)
   - Automatically breaks down tasks into 3-5 subtasks
   - Uses LLM to understand task context

2. **Focus Analysis** (`POST /api/analyze/focus`)
   - Analyzes tab context for focus detection
   - Provides AI-generated insights

3. **Habit Summaries** (future feature)
   - Generates natural language habit insights
   - Recommends optimal study schedules

## Security Notes

⚠️ **Important:**
- Never commit `.env` to git (it's in `.gitignore`)
- Never share your API keys publicly
- Rotate keys if accidentally exposed
- Use environment-specific keys for dev/prod

## Getting API Keys

### MiniMax
1. Visit: https://api.minimax.io
2. Sign up for an account
3. Navigate to API Keys section
4. Generate a new key
5. Copy to your `.env` file

### Anthropic
1. Visit: https://console.anthropic.com
2. Sign up for an account
3. Go to API Keys
4. Create a new key
5. Copy to your `.env` file

## Extension Integration

Once the backend is running with a valid API key:

1. Open the extension popup
2. Go to Settings
3. Set API Base URL to `http://localhost:5174`
4. Click Save
5. Try creating a task - you should see AI-generated subtasks!

---

**Need help?** Check the console logs when starting the server for detailed error messages.
