# ETL Anything

A visual workflow tool for document ETL (Extract, Transform, Load). Drag-and-drop nodes on a canvas, connect them into pipelines, and execute workflows that read documents, call Claude AI for reasoning, and produce structured outputs.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                       │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────────┐  │
│  │  Workflow    │  │   Node        │  │   Sidebar          │  │
│  │  Canvas      │  │   Components   │  │   (node palette)   │  │
│  │  (ReactFlow) │  │  Input/LLM/    │  │                    │  │
│  │              │  │  Output/Rule   │  │                    │  │
│  └──────┬───────┘  └───────────────┘  └────────────────────┘  │
│         │                                                      │
│         │  REST + JSON                                         │
│         ▼                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │  /api/       │  │  /api/       │  │  /api/             │   │
│  │  workflows   │  │  executions  │  │  files             │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└────────────────────────┬──────────────────────────────────────┘
                         │ HTTP
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (FastAPI)                           │
│                                                                 │
│  ┌──────────────┐   ┌───────────────┐   ┌─────────────────┐   │
│  │  Workflow    │──▶│  Node         │──▶│  Results /       │   │
│  │  Executor    │   │  Handlers     │   │  Output Files   │   │
│  │  (recursive  │   │  input_node   │   │                 │   │
│  │   DAG walk)  │   │  llm_node     │   │                 │   │
│  └──────────────┘   │  output_node  │   └─────────────────┘   │
│                    │  rule_node    │                         │
│  ┌──────────────┐   └───────────────┘                         │
│  │  Execution  │                                               │
│  │  Registry   │───▶ Anthropic (via Octane LLM proxy)          │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
```

## Node Types

| Frontend | Backend | Description |
|----------|---------|-------------|
| **Input** | `input` | Load data: PDF, TXT, MD, CSV, JSON files |
| **Reasoning** | `llm` | Call Claude AI with prompt + model selection |
| **Output** | `output` | Save result to file (JSON/TXT/CSV) |
| **Rule** | `rule` | Conditional branching (AND/OR logic) |

## Tech Stack

- **Frontend:** Next.js 15, React 19, ReactFlow, Tailwind CSS v4, TypeScript
- **Backend:** FastAPI, Python 3.10+, Pydantic, PyMuPDF
- **AI:** Anthropic Claude via Octane LLM proxy
- **Testing:** pytest (49 tests, all passing)

## Quick Start

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env           # set OCTANE_API_KEY
uvicorn main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**

### 3. Run Tests

```bash
cd backend && source venv/bin/activate && python -m pytest tests/ -v
```

---

## Repository Layout

```
.
├── docs/                   ← All documentation (READ THIS FIRST)
│   ├── README.md            ← Documentation index
│   ├── AGENTS.md            ← MUST READ for AI agents working in this repo
│   ├── ARCHITECTURE.md      ← System design & data flows
│   ├── REQUIREMENTS.md      ← Consolidated requirements (quick ref)
│   ├── USER_GUIDE.md        ← End-user walkthrough
│   ├── DEPLOYMENT & TESTING.md ← Dev setup, testing, adding nodes
│   ├── references/
│   │   ├── API_REFERENCE.md     ← REST endpoint specs
│   │   └── FRONTEND_REFERENCE.md ← Component inventory
│   ├── USER_GUIDE.md
│
├── backend/
│   ├── main.py            ← FastAPI entry point + all routes
│   ├── node_handlers.py   ← Node execution logic
│   ├── requirements.txt
│   ├── uploads/           ← Uploaded files
│   ├── outputs/            ← Generated output files
│   ├── workflows/          ← Saved workflow JSON files
│   └── tests/
│       ├── test_api.py
│       ├── test_workflow.py
│       └── test_node_handlers.py
│
└── frontend/
    ├── app/
    │   ├── layout.tsx     ← Root layout (ThemeProvider)
    │   ├── page.tsx       ← Main canvas page
    │   ├── components/
    │   │   └── workflow/
    │   │       ├── WorkflowCanvas.tsx   ← Main canvas component
    │   │       ├── Sidebar.tsx          ← Node palette
    │   │       ├── nodeConfig.ts        ← Node type definitions
    │   │       └── nodes/
    │   │           ├── InputNode.tsx
    │   │           ├── ReasoningNode.tsx
    │   │           ├── OutputNode.tsx
    │   │           └── RuleNode.tsx
    │   └── api/           ← Next.js API routes (proxies to backend)
    └── package.json
```

---

## Features

- [x] Visual DAG editor with drag-and-drop nodes
- [x] PDF/text/markdown/CSV/JSON file upload
- [x] Claude AI integration with model selection (Haiku/Sonnet/Opus)
- [x] Rule node with AND/OR conditional branching
- [x] Workflow save/load from database
- [x] Workflow export/import as JSON files
- [x] Execution cancellation
- [x] Progress tracking with polling
- [x] Dark mode (system/light/dark) with theme toggle
- [x] Node execution logs panel
- [x] Keyboard shortcuts (Ctrl+S/O/N/Z/Y, Delete/Backspace)
- [x] Node tooltip on hover with config summary
- [x] Orphaned node validation before save
- [x] Undo/redo for canvas (full history)
- [x] MiniMap toggle and auto-layout (dagre)
- [x] Pre-run validation (input files, I/O node check)
- [x] 49 automated tests

## Quick Links

- **New to the project?** → [AGENTS.md](./AGENTS.md) (MUST READ)
- **How to use** → [docs/USER_GUIDE.md](./docs/USER_GUIDE.md)
- **How to develop** → [docs/DEPLOYMENT & TESTING.md](./docs/DEPLOYMENT%20&%20TESTING.md)
- **All features** → [docs/features/](./docs/features/)
- **Quick ref** → [docs/REQUIREMENTS.md](./docs/REQUIREMENTS.md)

## Known Issues & TODO

See [docs/features/](./docs/features/) for all features, implementation status, and pending items.