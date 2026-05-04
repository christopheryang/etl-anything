# Nashville AI Training

Workshop materials for the Nashville on-site (May 12–13, 2026). Builds an "ETL Anything" workflow tool: a Next.js canvas UI that drives a FastAPI workflow engine calling Claude through Octane's LLM proxy.

## Repo layout

```
.
├── backend/    FastAPI workflow engine (Python)
└── frontend/   Next.js workflow canvas (TypeScript)
```

## Prerequisites

- **Python** 3.10+ (tested on 3.12 and 3.13)
- **Node.js** 20 LTS or 22 LTS (minimum 18.18)
- An **Octane LLM proxy key** from https://tools.ai-dev.octane.co/portal

The full pre-trip checklist (Claude Code, Claude Desktop, Okta access, GitHub access, key generation) lives in Confluence — finish that first, then come back here.

## Setup

```bash
git clone https://github.com/OctaneLendingTest/nashville-ai-training.git
cd nashville-ai-training
```

### Backend (terminal 1)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edit .env and set OCTANE_API_KEY to your Octane key
uvicorn main:app --reload --port 8000
```

> **Note:** `.env` overrides your shell exports. If you copy the example, fill in `OCTANE_API_KEY` — an empty value will mask your shell value. To rely on shell exports alone, skip the `cp` step.

Verify the server is up:

```bash
curl http://localhost:8000/
# {"service":"ETL Anything API","status":"running","version":"1.0.0"}
```

Smoke-test the LLM proxy connection. Run this from the `backend/` directory (not from inside `scripts/`) so the script can find `.env`:

```bash
python scripts/test_litellm.py
# should print a ping reply and token usage
```

### Frontend (terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

The frontend uses sensible defaults (`http://localhost:8000` for the backend, `../backend/uploads` for the uploads directory). Copy `.env.local.example` to `.env.local` only if you need to override them.

### End-to-end check

In the UI, upload one of the sample PDFs from `backend/docs/`, build a simple **Input → LLM → Output** workflow, and run it. The output file should be downloadable from the UI.

## Workshop branches

- `main` — starting state (challenge 0)
- `challenge-1`, `challenge-2`, ... — each step in the workshop progression

Check out the relevant branch at the start of each session.

## Help

Post in **#nashville-ai-jam-2026** on Slack and tag **Ruslan Fridman** or **Sean Howard**.
