# jayaremala — AI-Powered Personal Portfolio

Live at **[sabarishreddy99.github.io/jayaremala](https://sabarishreddy99.github.io/jayaremala)**

---

## The idea

Most portfolios are static pages you scroll past. This one starts a conversation. **Avocado** — Jaya's AI assistant — answers questions about experience, projects, and skills in real time using a retrieval-augmented generation pipeline over a structured knowledge base. It's faster to ask Avocado *"what's your strongest AI project?"* than to read five pages of documents or navigating over multiple pages.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| AI Chatbot | Gemma 4 31B via Google AI API (streaming SSE) |
| RAG | ChromaDB · sentence-transformers `all-MiniLM-L6-v2` |
| Backend | FastAPI · Python 3.11 |
| Blog | MDX · next-mdx-remote · gray-matter |
| Deployment | GitHub Pages (frontend) · Railway (backend) |

---

## Features

- **Avocado** — RAG-backed AI chatbot answering recruiter questions using 66 atomic knowledge chunks across experience, projects, education, skills, and synthesized FAQs
- **Streaming responses** — tokens stream in real time via Server-Sent Events
- **Voice input** — speak your question, transcribes via Web Speech API
- **Whack-an-Avocado** — mini-game that appears while the AI is thinking: tap avocados, dodge bombs 💣, build streaks, speed increases as you score
- **Session persistence** — conversation history survives page reloads via localStorage
- **Suggestion chips** — pre-filled recruiter questions on first load
- **Full portfolio** — Experience timeline, Education, Projects grid, MDX blog
- **Scrolling footer** — JAYA and SABARISH REDDY REMALA scroll in opposite directions; hover pauses animation and highlights individual letters

---

## RAG architecture

```
User message
    │
    ▼
Multi-query expansion (5–7 query variants)
    │
    ▼
ChromaDB cosine similarity search (top 8 per query)
    │
    ▼
Deduplicate + re-rank by score
    │
    ▼
Inject top-10 chunks as context into Gemma 4 system prompt
    │
    ▼
Stream response tokens → SSE → browser
```

Knowledge base lives in `backend/data/knowledge/` as JSON files mirroring the TypeScript data files. Auto-ingested into ChromaDB on every backend startup (idempotent).

---

## Project structure

```
itsjaya/
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx                   # Chatbot landing page
│       │   └── (portfolio)/               # Shared nav + footer layout
│       │       ├── portfolio/             # Portfolio home
│       │       ├── experience/
│       │       ├── education/
│       │       ├── projects/
│       │       └── blog/[slug]/           # MDX blog
│       ├── components/
│       │   ├── chat/                      # ChatInterface, ChatMessage, ChatInput, LoadingGame
│       │   ├── Nav.tsx
│       │   └── Footer.tsx
│       ├── data/                          # profile, experience, education, projects, skills
│       └── content/blog/                  # MDX posts
│
└── backend/
    └── src/app/
        ├── main.py                        # FastAPI app + RAG auto-ingest on startup
        ├── routers/ai.py                  # POST /ai/chat/stream + draft/rewrite endpoints
        ├── rag/
        │   ├── store.py                   # ChromaDB client, multi-query retrieval, re-ranking
        │   └── ingest.py                  # JSON → atomic chunks → ChromaDB upsert
        ├── core/settings.py
        └── data/knowledge/                # profile, experience, education, projects, skills JSON
```

---

## Running locally

**Frontend**
```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"

# copy and fill in your Google AI API key
cp .env.example .env

uvicorn app.main:app --app-dir src --reload   # http://localhost:8000
```

**.env**
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
GOOGLE_API_KEY=your_key_here
GEMMA_MODEL=gemma-4-31b-it
FRONTEND_ORIGIN=http://localhost:3000
```

---

## Deployment

| Service | How |
|---|---|
| Frontend | GitHub Actions → `next export` → GitHub Pages on every push to `main` |
| Backend | Railway — Docker deploy, auto-redeploys on push to `main` |

Set `NEXT_PUBLIC_API_BASE_URL` as a GitHub Actions secret pointing to your Railway URL.

---

## About

Built by [Jaya Sabarish Reddy Remala](https://linkedin.com/in/jayasabarishreddyr) — NYU Tandon CS MS · Qualcomm Edge AI Hackathon Winner · formerly NYU IT High-Speed Research Network, Shell, Wipro.

Currently obsessed with recommendation systems and search technology at scale.

→ [Resume](https://drive.google.com/drive/u/0/folders/1vm35z-6VQjtO9A8ZBgCvvSP_7_POPTrV) · [GitHub](https://github.com/sabarishreddy99) · [LinkedIn](https://linkedin.com/in/jayasabarishreddyr)
