# 📘 SigmaGPT — Complete Project Reference
### Built by Subham Tomar · Team Presentation Guide

---

> **For the team:** This document covers everything you need to understand, explain, and present SigmaGPT confidently. Read your section thoroughly before the presentation.

---

## 📌 Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure (File Map)](#3-project-structure)
4. [How It Works — System Flow](#4-how-it-works--system-flow)
5. [Backend — Explained](#5-backend--explained)
6. [Frontend — Explained](#6-frontend--explained)
7. [Dashboard — Explained](#7-dashboard--explained)
8. [API Endpoints Reference](#8-api-endpoints-reference)
9. [Key Features](#9-key-features)
10. [How to Run Locally](#10-how-to-run-locally)
11. [Deployment (Vercel)](#11-deployment-vercel)
12. [Team Roles Breakdown](#12-team-roles-breakdown)
13. [Presentation Talking Points](#13-presentation-talking-points)
14. [Common Q&A — Likely Interview/Viva Questions](#14-common-qa--likely-intervieviva-questions)

---

## 1. Project Overview

**SigmaGPT** is a full-stack AI chat application — similar to ChatGPT — built from scratch by Subham Tomar. It lets users have real, multi-turn conversations with an AI powered by **Mistral AI's language models**.

### What makes it special:
- 🧠 **Multi-turn memory** — the AI remembers your previous messages within a conversation
- 🔄 **Auto model fallback** — if one AI model fails, it automatically switches to a backup
- 📊 **Live analytics dashboard** — see real stats about your usage
- 💾 **Conversation history** — all chats saved locally in a database
- 🚀 **Deployable to Vercel** — serverless-ready for production

### In one sentence for the presentation:
> *"SigmaGPT is a production-ready AI chatbot web application with persistent multi-turn conversations, automatic AI model fallback, and a live analytics dashboard — built on React, Express, SQLite, and the Mistral AI API."*

---

## 2. Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | v19 | UI framework — builds all the components |
| **Vite** | v7 | Build tool & dev server (fast hot reload) |
| **React Markdown** | v10 | Renders AI replies with markdown formatting |
| **rehype-highlight** | v7 | Syntax highlighting for code blocks in AI responses |
| **uuid** | v11 | Generates unique IDs for each conversation thread |
| **CSS Variables** | — | Theming system (black & white design) |
| **Inter font** | — | Google Font used across the entire UI |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | — | JavaScript runtime for the server |
| **Express.js** | v5 | Web server & API routing |
| **SQLite** | — | Local database to store all conversations |
| **sqlite** (wrapper) | — | Promise-based SQLite interface for async/await |
| **Mistral AI SDK** | — | Connects to Mistral's AI API to get responses |
| **dotenv** | — | Loads environment variables (API keys) from `.env` |
| **cors** | — | Allows frontend to communicate with the backend |

### AI
| Model | Used For |
|---|---|
| `ministral-8b-latest` | **Primary model** — fast, capable, free tier |
| `ministral-3b-latest` | **Fallback #1** — smaller, if primary fails |
| `open-mistral-7b` | **Fallback #2** — last resort backup |

### Deployment
| Tool | Role |
|---|---|
| **Vercel** | Cloud hosting — auto-detects and deploys the app |
| **vercel.json** | Config file that routes API calls to the Express server |
| **GitHub** | Source code hosting — `git@github.com:subham1533/SigmaGpt.git` |

---

## 3. Project Structure

```
SigmaGpt/                          ← Root of the project
│
├── package.json                   ← Root npm workspace config
├── vercel.json                    ← Vercel deployment routing rules
├── .env                           ← API keys (NOT committed to git)
│
├── api/
│   └── index.js                   ← Vercel serverless entry point
│
├── Backend/                       ← All server-side code
│   ├── server.js                  ← Express app setup, starts on port 5000
│   ├── package.json               ← Backend dependencies list
│   ├── test-suite.js              ← Automated tests (15 tests)
│   │
│   ├── routes/
│   │   └── chat.js                ← All API route handlers (chat, threads, health, stats)
│   │
│   └── utils/
│       ├── mistral.js             ← Connects to Mistral AI, handles fallback
│       └── database.js            ← SQLite setup, read/write helpers
│
└── Frontend/                      ← All client-side code
    ├── index.html                 ← HTML entry point (loads React app)
    ├── vite.config.js             ← Vite config (proxy /api → localhost:5000)
    ├── package.json               ← Frontend dependencies list
    │
    └── src/
        ├── main.jsx               ← Mounts React app to the DOM
        ├── App.jsx                ← Root component — holds all shared state
        ├── App.css                ← Global CSS variables & base styles
        ├── MyContext.jsx          ← React Context — shares state across components
        │
        ├── SigmaLogo.jsx          ← Custom SVG Σ logo component
        │
        ├── Sidebar.jsx            ← Left panel: brand, nav, chat history, creator card
        ├── Sidebar.css
        │
        ├── ChatWindow.jsx         ← Main chat area: navbar, input box, send logic
        ├── ChatWindow.css
        │
        ├── Chat.jsx               ← Message list: bubbles, hero empty state, suggestions
        ├── Chat.css
        │
        ├── Dashboard.jsx          ← Analytics dashboard with stats, charts, activity
        └── Dashboard.css
```

---

## 4. How It Works — System Flow

### User sends a message:

```
[User types message]
        ↓
[ChatWindow.jsx] — captures input, calls getReply()
        ↓
POST /api/chat  →  [Express Backend]
        ↓
[chat.js route] — loads conversation history from SQLite
        ↓
[mistral.js] — sends full conversation history to Mistral AI
        ↓
[Mistral AI Cloud] — generates reply using ministral-8b-latest
        ↓
[Backend] — saves user message + AI reply to SQLite
        ↓
[Frontend] — displays AI reply as markdown in Chat.jsx
```

### Multi-turn memory explained:

Every time a user sends a message, the backend:
1. Fetches the **entire conversation history** from SQLite
2. Sends ALL previous messages (not just the latest one) to Mistral AI
3. This is why the AI "remembers" what you said earlier in the same chat

### Model fallback explained:

```
Try ministral-8b-latest
  → If HTTP 429 (rate limit) or 403 (not available):
      Try ministral-3b-latest
        → If fails again:
            Try open-mistral-7b
              → If all fail: return error to user
```

---

## 5. Backend — Explained

### `Backend/server.js`
- Creates the Express application
- Sets up **CORS** so the React frontend can communicate with it
- Registers all routes under `/api` prefix
- Starts listening on **port 5000** (unless running on Vercel)

### `Backend/routes/chat.js`
All 5 API routes live here:

| Route | Method | What it does |
|---|---|---|
| `/api/health` | GET | Returns server status, model name, DB connection status |
| `/api/stats` | GET | Returns dashboard data: thread count, message counts, recent activity |
| `/api/thread` | GET | Returns list of all saved conversation threads |
| `/api/thread/:id` | GET | Returns all messages in one specific thread |
| `/api/thread/:id` | DELETE | Deletes a conversation permanently |
| `/api/chat` | POST | Sends a message and gets back an AI reply |

### `Backend/utils/mistral.js`
- Initializes the Mistral AI client with the API key
- Takes the **full conversation array** as input (multi-turn aware)
- Has automatic fallback — tries 3 models before giving up
- Returns the AI's text response as a string

### `Backend/utils/database.js`
- Opens/creates an SQLite database file at `Backend/data/sigmagpt.sqlite`
- Creates the `threads` table if it doesn't exist (auto-migration)
- On Vercel, uses `/tmp/` directory (because Vercel's filesystem is read-only except `/tmp`)
- Exports `getDatabase()` and `parseThread()` helper functions

### Database schema:
```sql
CREATE TABLE threads (
    threadId   TEXT PRIMARY KEY,   -- unique UUID for each conversation
    title      TEXT NOT NULL,      -- first message (truncated to 50 chars)
    messages   TEXT NOT NULL,      -- JSON array of all messages
    createdAt  TEXT NOT NULL,      -- ISO timestamp when chat started
    updatedAt  TEXT NOT NULL       -- ISO timestamp of last message
)
```

### `Backend/test-suite.js`
- 15 automated tests that verify the entire system
- Tests: AI connectivity, fallback logic, multi-turn memory, database CRUD, all HTTP routes
- Run with: `npm test` from the root or `node test-suite.js` from `Backend/`

---

## 6. Frontend — Explained

### `src/main.jsx`
Entry point — mounts the `<App />` component into `index.html`

### `src/App.jsx` — State Manager
The root component. Holds all **shared state** and passes it through React Context:

| State | Type | Purpose |
|---|---|---|
| `prompt` | string | Current message the user is typing |
| `reply` | string/null | Latest AI reply received |
| `currThreadId` | UUID | Which conversation is currently active |
| `prevChats` | array | All messages in the current conversation |
| `newChat` | boolean | Whether this is a fresh unsaved conversation |
| `allThreads` | array | List of all saved conversations (for sidebar) |
| `sidebarOpen` | boolean | Whether the sidebar is visible |
| `view` | string | `"chat"` or `"dashboard"` — controls which page shows |

### `src/MyContext.jsx`
React Context provider — lets all components access shared state without prop-drilling

### `src/Sidebar.jsx`
- Shows the **SigmaGPT brand** at the top
- **New Chat** button — creates a fresh thread with a new UUID
- **Chat / Dashboard** navigation toggle
- **Recent Chats** list — fetched from `/api/thread`, clickable to switch conversations
- **Delete** button on each thread
- **Subham Tomar creator card** at the bottom

### `src/ChatWindow.jsx`
- Top **navbar** with model name, "by Subham Tomar" badge, Dashboard button
- **Textarea input** with auto-resize and Enter key support
- **Send button** (arrow icon) — calls `getReply()` which POSTs to `/api/chat`
- **Animated thinking dots** while waiting for the AI response

### `src/Chat.jsx`
- **Empty state hero** — shows SigmaGPT logo + welcome text + 4 suggestion cards when no messages yet
- **Message bubbles** — user messages on right, AI messages on left with Sigma avatar
- **Markdown rendering** — AI replies support bold, italic, lists, and code blocks
- **Code block copy button** — copies code to clipboard
- **Auto-scroll** — jumps to latest message automatically

### `src/SigmaLogo.jsx`
- Custom SVG Σ (Sigma) logo — pure React component
- Accepts `size` prop to resize anywhere it's used
- Replaces the original ChatGPT/OpenAI logo

---

## 7. Dashboard — Explained

### How to open it:
1. Click **"Dashboard"** in the sidebar navigation
2. Or click **"Dashboard"** button in the top navbar of the chat

### What it shows:

| Section | Data Shown |
|---|---|
| **Status Banner** | Live system status (green = all ok), active AI model, DB connection, first chat date |
| **6 Stat Cards** | Total conversations, total messages, your messages, AI responses, avg messages/chat, active model |
| **Message Breakdown** | Visual bar chart showing % of your messages vs AI messages |
| **Recent Conversations** | Last 5 chats with title, message count, start date, relative time |
| **System Info** | Full tech stack, model name, DB connection status, creator name |

### How the data is loaded:
- Dashboard calls `GET /api/stats` and `GET /api/health` simultaneously (parallel fetch)
- Auto-refreshes every **30 seconds**
- Manual refresh button with spinning animation while loading
- Shows "just now / Xm ago / Xh ago / Xd ago" for timestamps

---

## 8. API Endpoints Reference

**Base URL (local):** `http://localhost:5000/api`

### `GET /api/health`
```json
{
  "status": "ok",
  "model": "ministral-8b-latest",
  "database": "connected"
}
```

### `GET /api/stats`
```json
{
  "totalThreads": 3,
  "totalMessages": 8,
  "totalUserMessages": 4,
  "totalAssistantMessages": 4,
  "model": "ministral-8b-latest",
  "firstChatAt": "2026-09-23T18:16:42.380Z",
  "recentActivity": [
    {
      "title": "hiiii",
      "messageCount": 2,
      "updatedAt": "2026-10-14T03:59:09.232Z",
      "createdAt": "2026-10-14T03:59:07.122Z"
    }
  ]
}
```

### `POST /api/chat`
Request body:
```json
{
  "threadId": "some-uuid-v1",
  "message": "Hello, how are you?"
}
```
Response:
```json
{
  "reply": "I'm doing great! How can I help you today?"
}
```

### `GET /api/thread`
```json
[
  { "threadId": "abc-123", "title": "hiiii", "messages": [...], "createdAt": "...", "updatedAt": "..." }
]
```

### `GET /api/thread/:threadId`
```json
[
  { "role": "user", "content": "hi", "timestamp": "..." },
  { "role": "assistant", "content": "Hello! How can I help?", "timestamp": "..." }
]
```

### `DELETE /api/thread/:threadId`
```json
{ "success": "Thread deleted successfully" }
```

---

## 9. Key Features

### ✅ Multi-Turn Conversation Memory
When you chat, the AI gets the full history of that conversation — not just your latest message. This lets it answer follow-up questions intelligently.

### ✅ Automatic AI Model Fallback
If the primary Mistral model is unavailable or rate-limited, the app automatically tries backup models. Users never see an error because of a model issue.

### ✅ Persistent Chat History
All conversations are saved in SQLite. You can close the browser, come back, and all your chats are still there in the sidebar.

### ✅ Analytics Dashboard
A real-time overview of all your usage — conversation counts, message breakdowns, recent activity, and system health — all on a clean dark dashboard.

### ✅ Professional Black & White UI
Built with CSS custom properties (variables), Inter font, consistent spacing and typography. Sidebar, chat window, and dashboard all share the same design system.

### ✅ Vercel Serverless Ready
The app is configured to deploy to Vercel with zero extra setup:
- `vercel.json` routes `/api/*` to the Express server
- `api/index.js` exports the Express app as a serverless function
- Database automatically uses `/tmp/` on Vercel

### ✅ Automated Tests (15 tests)
A complete test suite covers AI integration, fallback, multi-turn memory, database operations, and every HTTP endpoint.

---

## 10. How to Run Locally

### Prerequisites
- Node.js v18+ installed
- A Mistral AI API key (free at [console.mistral.ai](https://console.mistral.ai))

### Step 1 — Clone the project
```bash
git clone git@github.com:subham1533/SigmaGpt.git
cd SigmaGpt
```

### Step 2 — Install dependencies
```bash
# Install all (root + backend + frontend)
npm install
cd Backend && npm install
cd ../Frontend && npm install
```

### Step 3 — Set up environment variables
Create `Backend/.env`:
```
MISTRAL_API_KEY=your_actual_key_here
MISTRAL_MODEL=ministral-8b-latest
```

### Step 4 — Run backend (Terminal 1)
```bash
cd Backend
node server.js
# → Server running on http://localhost:5000
```

### Step 5 — Run frontend (Terminal 2)
```bash
cd Frontend
npm run dev
# → App running on http://localhost:5173
```

### Step 6 — Run tests (optional)
```bash
cd Backend
node test-suite.js
# → 15 PASSED, 0 FAILED
```

---

## 11. Deployment (Vercel)

The app is pre-configured for Vercel deployment:

### `vercel.json` routing:
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.js" },
    { "source": "(.*)", "destination": "/index.html" }
  ]
}
```

### `api/index.js`:
```js
export { default } from "./Backend/server.js";
```
This file exports the Express app as a Vercel serverless function.

### Vercel-specific adjustments in the code:
- `server.js` only calls `app.listen()` when `process.env.VERCEL` is not set
- `database.js` stores SQLite in `/tmp/sigmagpt_data` on Vercel (since `/tmp` is the only writable directory)

---

## 12. Team Roles Breakdown

> Adjust this section to match your actual team contributions before the presentation.

### Suggested split for explaining the project:

| Team Member | Covers |
|---|---|
| **Member 1** | Project overview, tech stack, how the AI works (Mistral, fallback, multi-turn memory) |
| **Member 2** | Backend — Express server, API routes, SQLite database, test suite |
| **Member 3** | Frontend — React components, UI/UX design, Dashboard, Vercel deployment |

---

## 13. Presentation Talking Points

### Opening (30 seconds)
> "SigmaGPT is a full-stack AI chatbot we built using React, Express, and the Mistral AI API. It supports multi-turn conversations with persistent history, has an automatic model fallback system, and includes a live analytics dashboard."

### For the demo — suggested flow:
1. Open the app at `http://localhost:5173`
2. Show the **empty state** with suggestion cards
3. Click a suggestion card → message auto-fills → send it
4. Point out the **AI response with markdown formatting**
5. Send a follow-up question (prove multi-turn memory works)
6. Open the **sidebar** — show conversation history
7. Switch to **Dashboard** — walk through the stats
8. Mention: "The backend has 15 automated tests, all passing"
9. Mention: "Deployed to Vercel for production use"

### Key stats to mention:
- **15 tests passing** — zero failures
- **3 AI models** — with automatic fallback
- **6 API endpoints** — fully RESTful
- **2 main views** — Chat and Dashboard
- **Full conversation history** — SQLite persisted

---

## 14. Common Q&A — Likely Interview/Viva Questions

**Q: What is React Context and why did you use it?**
> React Context allows sharing state (like the current thread ID, all messages, sidebar state) across deeply nested components without "prop drilling" (passing props through every level). We created `MyContext.jsx` which wraps the entire app so any component can read or update shared state.

**Q: What is the difference between `useState` and `useEffect` in React?**
> `useState` stores data that can change and triggers a re-render when it changes (e.g., the prompt the user typed). `useEffect` runs side effects after rendering (e.g., fetching thread list from the API when the component mounts, or when `currThreadId` changes).

**Q: Why SQLite instead of MongoDB or PostgreSQL?**
> SQLite is a file-based database — no separate server needed. Perfect for this project because it keeps everything simple and self-contained. On Vercel, we use the `/tmp` directory for the SQLite file since serverless functions need a writable path.

**Q: How does multi-turn conversation work?**
> Every time a user sends a message, we fetch the full message history for that thread from SQLite, add the new user message, and send the entire array to Mistral AI. This way the AI has context of everything said before, not just the latest message.

**Q: What happens when the Mistral API rate limit is hit?**
> The `getMistralAPIResponse()` function in `mistral.js` has a fallback array: `["ministral-8b-latest", "ministral-3b-latest", "open-mistral-7b"]`. It catches 429 (rate limit) or 403 (not available) errors and automatically retries with the next model in the list — fully transparent to the user.

**Q: What is Vite and why use it over Create React App?**
> Vite is a modern build tool that's significantly faster than Create React App. It uses native ES modules in the browser during development, so it starts instantly (no bundling), and only rebuilds changed files. Our build took ~1.6 seconds.

**Q: What does the `/api` proxy in Vite config do?**
> During development, the React app runs on port 5173 and the backend on port 5000. Any request to `/api/*` from the React app gets proxied to `http://localhost:5000` by Vite. This avoids CORS issues in development and matches the production setup.

**Q: What is a REST API?**
> REST (Representational State Transfer) is a standard for designing APIs. Each endpoint represents a resource (like a chat thread). We use HTTP methods semantically: GET to read data, POST to create/send data, DELETE to remove data. Our 6 endpoints follow REST conventions.

**Q: How is the Dashboard data collected?**
> The `GET /api/stats` endpoint queries the SQLite database: it counts total threads, loops through all threads to count individual messages, identifies user vs assistant messages, picks the 5 most recent threads for the activity list, and finds the oldest thread date. All returned as a single JSON object.

**Q: Why is `.env` not in GitHub?**
> `.env` contains the Mistral API key — a secret credential. If pushed to GitHub, anyone could use our API key and exhaust our credits. `.gitignore` explicitly excludes `.env` files from being tracked.

**Q: What is the difference between `async/await` and Promises?**
> Promises use `.then()/.catch()` chaining. `async/await` is syntactic sugar over Promises — it lets you write asynchronous code that reads like synchronous code, making it much easier to read and debug. All our API calls use `async/await`.

**Q: How does Vercel deployment work for this project?**
> Vercel reads `vercel.json`. API requests (`/api/*`) are routed to `api/index.js` which exports our Express app as a serverless function. All other requests (`/*`) serve the built React frontend from `index.html`. The frontend is statically built with `npm run build` which Vercel runs automatically.

---

## 🔗 Links

| Resource | URL |
|---|---|
| **GitHub Repository** | https://github.com/subham1533/SigmaGpt |
| **Local App** | http://localhost:5173 |
| **Local API** | http://localhost:5000/api |
| **Health Check** | http://localhost:5000/api/health |
| **Stats** | http://localhost:5000/api/stats |
| **Mistral AI Console** | https://console.mistral.ai |

---

*Document generated for SigmaGPT presentation — Subham Tomar*
