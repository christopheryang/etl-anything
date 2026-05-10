# AGENTS.md — Guide for AI Agents

**READ THIS FILE BEFORE DOING ANY WORK IN THIS REPOSITORY.**

This project is actively being developed. As an AI agent, you are expected to follow the rules in this document every time you work in this repo. Documentation drift is a first-class bug — if you change something, update the docs. If the docs are wrong, fix them.

---

## Project Basics

**Name:** ETL Anything
**Repo:** `etl-anything` (root of this repository)
**Stack:** Next.js (ReactFlow canvas) + FastAPI (workflow engine) + Claude via Octane proxy

**Key People:**
- Human: Project owner (owner)
- AI Agents: Us (working in this repo)

**Current Focus:** Active development sprint. Features and bugs are being implemented in repeated work sessions.

---

## Iteration Rules

### Core Rule
> **Never leave the repo in a broken or undocumented state.**

Before you finish any session:
1. All tests pass
2. Frontend TypeScript compiles (zero errors)
3. Documentation reflects reality

### The Session Loop

When working on a feature or bug fix:

1. **Read the relevant docs first** — `docs/features/`, `docs/REQUIREMENTS.md`, `docs/ARCHITECTURE.md`
2. **Check current status** — what's in-progress, what's pending
3. **Implement** — code, tests, validation
4. **Verify** — run tests + TypeScript check
5. **Update docs** — before finishing the session:
   - Create or update `docs/features/Feature NNN.md` (requirements, planning, implementation, caveats)
   - Mark feature status: Done / In Progress / Pending
   - Add entry to `CHANGELOG.md` (date, who, what)
   - If user-facing behavior changed: update `docs/USER_GUIDE.md`
   - If dev workflow changed: update `docs/DEPLOYMENT & TESTING.md`
### The Doc-Update Rule
> **Every code change must be reflected in documentation before the session ends.**

This is not optional. If you implement a feature and don't document it, it's treated as not done.

Specific rules:
- New feature added → create `docs/features/Feature NNN.md` with requirements, planning, implementation, caveats
- Bug fixed → add entry to `CHANGELOG.md` (use patch version, e.g. v0.3.1) + create/update `docs/features/Feature NNN.md`
- File structure changed → update `ARCHITECTURE.md` or `docs/DEPLOYMENT & TESTING.md`
- API behavior changed → update `API_REFERENCE.md`
- New dependency added → update `docs/DEPLOYMENT & TESTING.md`

### Asking for Clarification
Use `clarify()` when:
- The task has ambiguous requirements
- A decision has meaningful trade-offs the user should weigh
- You need context that isn't in the docs

Don't use `clarify()` for:
- Technical questions you can resolve yourself
- Simple confirmation (just do the reasonable thing)

---

## Important Conventions

### Test Before Finishing
Always run:
```bash
# Frontend TypeScript
cd frontend && npx -p typescript tsc --noEmit 2>&1 | grep -v "^npm warn"

# Backend tests
cd backend && source venv/bin/activate && python -m pytest tests/ -q
```

If either fails, fix it before finishing.

### Use session_search
If the user references something from a past session (e.g., "we discussed this before", "as I mentioned"), use `session_search()` to find it. Don't ask the user to repeat themselves.

### Use skills_list / skill_view
Check available skills before using tools like `delegate_task`, `cronjob`, etc. Skills are in `~/.hermes/skills/`.

### Memory
Save persistent facts about the project using `memory()`:
- User preferences (e.g., "user prefers concise responses")
- Environment facts (e.g., "Node 22 is installed, Python 3.14")
- Conventions (e.g., "workflows are stored as JSON files, not in a DB")
- Tool quirks

Don't save task progress or session state to memory.

### Save Workflows as Skills
After completing a complex multi-step task (5+ tool calls, or discovered approach worth reusing), save it as a skill with `skill_manage(action='create')`. Target: `~/.hermes/skills/`.

### Keep Feature Docs Current
After completing any feature or bug fix, the corresponding `docs/features/Feature NNN.md` must be updated with the final implementation state. If the feature is done, mark it "Done". Don't leave feature docs stale — treat outdated documentation as a bug.

---

## File Structure

```
docs/
  README.md              ← This file index
  AGENTS.md              ← You are here
  ARCHITECTURE.md        ← System design
  REQUIREMENTS.md        ← Consolidated requirements (quick ref)
  USER_GUIDE.md          ← End-user documentation
  DEPLOYMENT & TESTING.md ← Dev setup + commands
  references/
    API_REFERENCE.md     ← REST endpoints
    FRONTEND_REFERENCE.md  ← Component inventory
  features/              ← One file per feature (F001–F021)

backend/
  main.py                ← FastAPI entry point + routes
  node_handlers.py       ← Node execution logic
  tests/                 ← pytest tests (49 passing)

frontend/
  app/
    layout.tsx           ← Root layout (ThemeProvider)
    page.tsx             ← Main page
    components/
      workflow/
        WorkflowCanvas.tsx  ← Main canvas (all state lives here)
        Sidebar.tsx        ← Node palette
        nodeConfig.ts      ← Node type configs
        nodes/
          InputNode.tsx
          ReasoningNode.tsx
          OutputNode.tsx
          RuleNode.tsx
      types/
        workflow.ts         ← TypeScript interfaces
```

---

## Frontend State (WorkflowCanvas.tsx)

All ReactFlow state and workflow metadata lives in `WorkflowCanvas.tsx`. Key state:
- `nodes`, `edges` — ReactFlow state
- `workflowName`, `workflowId`, `workflowDescription` — metadata
- `workflowStatus: "idle"|"pending"|"processing"|"completed"|"failed"` — execution
- `isExecuting`, `currentExecutionId`, `progress`, `statusMessage`
- `showSaveModal`, `showLoadModal`, `showLogs`
- `showMiniMap`, `hoveredNode`
- `reactFlow` from `useReactFlow()` — needed for undo/redo/fitView

---

## Backend Architecture

- `executions: Dict[str, ExecutionState]` — in-memory registry, NOT persistent
- Workflows are stored as JSON files in `backend/workflows/`
- Files in `backend/uploads/`, outputs in `backend/outputs/`
- `execute_node_recursive` walks the DAG; rule nodes branch on true/false handles

---

## Node Type Mapping

| Frontend (ReactFlow) | Backend (main.py) | Files |
|---------------------|-------------------|-------|
| `input` | `input` | InputNode.tsx, node_handlers.py |
| `reasoning` | `llm` | ReasoningNode.tsx, node_handlers.py |
| `output` | `output` | OutputNode.tsx, node_handlers.py |
| `rule` | `rule` | RuleNode.tsx, node_handlers.py |

---

## Key Commands

```bash
# Backend
cd backend && source venv/bin/activate
uvicorn main:app --reload --port 8000
python -m pytest tests/ -v

# Frontend
cd frontend && npm run dev
npx -p typescript tsc --noEmit

# Run both (two terminals)
# Terminal 1: backend on :8000
# Terminal 2: frontend on :3000
```

---

## Environment Variables

**Backend** (`backend/.env`):
- `OCTANE_API_KEY` — required for LLM calls
- `UPLOADS_DIR`, `OUTPUTS_DIR`, `WORKFLOWS_DIR` — optional overrides

**Frontend** (`frontend/.env.local`):
- `NEXT_PUBLIC_API_URL` — backend URL (default: http://localhost:8000)

---

## Adding a New Node Type

1. **Backend** — Add handler in `node_handlers.py` (`handle_<type>_node`)
2. **Frontend** — Create component in `nodes/` (e.g., `MyNode.tsx`)
3. **Frontend** — Add to `nodeConfig.ts` (`NODE_CONFIGS` record)
4. **Frontend** — Add to `workflow.ts` types
5. **Frontend** — Add to `nodes/index.ts` (if separate)
6. **Frontend** — Add to `WorkflowCanvas.tsx` `nodeTypes` object
7. **Tests** — Add pytest tests in `backend/tests/`
8. **Docs** — Update `ARCHITECTURE.md`, `USER_GUIDE.md`, `references/API_REFERENCE.md`

---

## Bug Fix Protocol

1. Confirm the bug exists (read the relevant file)
2. Fix it in the most minimal way possible
3. Run tests + TypeScript check
4. Add entry to `CHANGELOG.md`
5. Create or update `docs/features/Feature NNN.md` for the bug fix

---

## Contact

Human: Project owner
Project: ETL Anything (etl-anything)