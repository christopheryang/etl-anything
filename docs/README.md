# Documentation — ETL Anything

Welcome. This `docs/` folder contains the complete, authoritative documentation for the ETL Anything project.

## File Index

| Document | Purpose |
|----------|---------|
| **`AGENTS.md`** | **MUST READ** for any AI agent — iteration rules, doc-update discipline, conventions, file locations. Located at repo root. |
| `ARCHITECTURE.md` | System design with diagrams: frontend/backend architecture, data flows, DAG execution model, database schema, key design decisions |
| `REQUIREMENTS.md` | Consolidated requirements for all 21 features — quick reference with links to feature docs |
| `USER_GUIDE.md` | End-user walkthrough: adding nodes, connecting them, configuring each type, running workflows, save/load, import/export, dark mode, troubleshooting |
| `DEPLOYMENT & TESTING.md` | Dev setup: environment setup, all commands (backend/frontend), testing, debugging, adding new node types |
| `references/API_REFERENCE.md` | All REST endpoints with request/response JSON examples |
| `references/FRONTEND_REFERENCE.md` | Frontend component inventory: all components, their props, key state, hooks |
| `features/` | **One file per feature** — requirements, planning, implementation, caveats for each feature (F001–F021) |

---

## Quick Start for New Agents

**Read this first:** [AGENTS.md](../AGENTS.md) (at repo root)

**Check these before starting work:**
1. `features/` — what's already been built and what's in progress
2. `ARCHITECTURE.md` — how the system fits together
3. `references/FRONTEND_REFERENCE.md` — frontend component inventory

**After completing work:**
1. Create or update the corresponding `features/Feature NNN.md` file
2. Update the feature's status if completed (In Progress → Done, or Pending → Done)
3. Add entry to `CHANGELOG.md` (repo root)
4. If changing behavior, update `USER_GUIDE.md` and/or `DEPLOYMENT & TESTING.md`

---

## Project Overview

**ETL Anything** is a visual DAG workflow tool for document ETL.

- **Frontend:** Next.js 15 + ReactFlow canvas + Tailwind CSS v4 + TypeScript
- **Backend:** FastAPI + Python 3.10+ + Pydantic + PyMuPDF
- **AI:** Anthropic Claude via Octane LLM proxy
- **Testing:** 49 pytest tests, all passing