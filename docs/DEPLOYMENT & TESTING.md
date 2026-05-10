# Deployment & Testing

## Prerequisites

- **Python** 3.10+ (tested on 3.12 and 3.14)
- **Node.js** 20 LTS or 22 LTS (minimum 18.18)
- **npm** or **pnpm**
- An **Octane LLM proxy key** from https://tools.ai-dev.octane.co/portal

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/christopheryang/etl-anything.git
cd etl-anything
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set OCTANE_API_KEY=your_key_here

# Start the server
uvicorn main:app --reload --port 8000
```

**Verify backend is running:**
```bash
curl http://localhost:8000/
# {"service":"ETL Anything API","status":"running","version":"1.0.0"}
```

**Test LLM connectivity:**
```bash
cd backend
python scripts/test_litellm.py
# Should print a ping reply and token usage
```

### 3. Frontend Setup

```bash
cd frontend

npm install

# Optional: override backend URL or uploads path
cp .env.local.example .env.local

npm run dev
```

Open **http://localhost:3000**

---

## Commands Reference

### Backend

```bash
cd backend
source venv/bin/activate

# Start server (development)
uvicorn main:app --reload --port 8000

# Start server (production)
uvicorn main:app --host 0.0.0.0 --port 8000

# Run tests
python -m pytest tests/ -v

# Run tests with coverage
python -m pytest tests/ --cov=. --cov-report=term-missing

# Run specific test file
python -m pytest tests/test_workflow.py -v

# Run specific test
python -m pytest tests/test_workflow.py::TestWorkflowExecution::test_rule_node_evaluates_false_path -v

# Lint (manual)
python -m flake8 main.py node_handlers.py --max-line-length=120

# Open Python REPL
python
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Production server
npm start

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

---

## Testing

### Backend Tests (49 tests, all passing)

```bash
cd backend && source venv/bin/activate

# Run all tests
python -m pytest tests/ -v

# Run with coverage report
python -m pytest tests/ --cov=. --cov-report=term-missing --cov-report=html
# Open htmlcov/index.html in browser

# Run in watch mode (re-runs on file changes)
python -m pytest tests/ -v --watch
```

**Test files:**

| File | Tests | What it covers |
|------|-------|----------------|
| `test_api.py` | 10 | API endpoints: workflows CRUD, execution start/poll/cancel/download, file upload/list |
| `test_workflow.py` | 11 | DAG parsing, topological sort, node execution ordering, incoming_edges, rule node branching |
| `test_node_handlers.py` | 15 | handle_input_node (all file types), handle_llm_node (mocked), handle_output_node, handle_rule_node (all operators + AND/OR logic) |

**Key test cases:**
- `test_rule_node_and_logic` — AND logic where both conditions must be true
- `test_rule_node_or_logic` — OR logic where either condition true
- `test_rule_node_nested_json_path` — Dot-notation path resolution (e.g., `data.score`)
- `test_rule_node_in_operator` — `in` and `not in` operators
- `test_rule_node_comparison_operators` — >, <, >=, <=
- `test_simple_linear_workflow` — Three-node pipeline: Input → LLM → Output
- `test_multiple_upstream_nodes` — DAG with two nodes converging on one downstream node
- `test_unknown_node_type_raises` — Unknown node type throws ValueError
- `test_workflow_cancellation` — DELETE /api/executions/{id} sets status to cancelled

### Frontend Type Checking

```bash
cd frontend
npx tsc --noEmit
```

No runtime tests currently configured, but the app can be manually tested via the browser at http://localhost:3000.

---

## Environment Variables

### Backend (`backend/.env`)

```bash
# Required
OCTANE_API_KEY=sk_live_your_octane_key_here

# Optional (with defaults)
HOST=0.0.0.0
PORT=8000
UPLOADS_DIR=./uploads
OUTPUTS_DIR=./outputs
WORKFLOWS_DIR=./workflows
```

**Note:** `.env` overrides shell environment variables. If you copy `.env.example` but leave `OCTANE_API_KEY` empty, it will mask any shell-exported key.

### Frontend (`frontend/.env.local`)

```bash
# Optional — defaults to http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional — defaults to ../backend/uploads
NEXT_PUBLIC_UPLOADS_DIR=http://localhost:8000/api/files
```

---

## Project Structure Details

### Backend Entry Point (`main.py`)

The FastAPI app. Contains:
- All route handlers (workflows, executions, files)
- `execute_node_recursive()` — DAG executor
- `Node`, `Workflow`, `ExecutionState` Pydantic models
- Execution registry (`executions: Dict[str, ExecutionState]`)
- CORS middleware configuration

### Node Handlers (`node_handlers.py`)

Pure functions that execute a single node:

```python
handle_input_node(node, execution_id, input_data, **kwargs) -> str
handle_llm_node(node, execution_id, input_data, anthropic_client, **kwargs) -> str
handle_output_node(node, execution_id, input_data, **kwargs) -> str
handle_rule_node(node, execution_id, input_data, **kwargs) -> str
```

The `NODE_HANDLERS` registry maps `node.type` → handler function.

### Frontend Canvas (`WorkflowCanvas.tsx`)

Main client component. Key functions:

```typescript
runWorkflow()         // Build workflow JSON, POST /api/executions, start polling
cancelExecution()    // DELETE /api/executions/{id}
saveWorkflow()        // POST /api/workflows
loadWorkflow(id)      // GET /api/workflows/{id}, restore nodes/edges to canvas
exportWorkflow()     // Serialize canvas → JSON file download
importWorkflow(e)     // Load JSON file → setNodes/setEdges
fetchWorkflows()      // GET /api/workflows for load modal
```

---

## Adding a New Node Type

### Backend

1. Add handler function in `node_handlers.py`:
   ```python
   def handle_my_node(node, execution_id, input_data, **kwargs) -> str:
       # node.data contains the node's configuration
       return "result string"
   ```

2. Register in `NODE_HANDLERS` dict:
   ```python
   NODE_HANDLERS = {
       ...
       "my_node": handle_my_node,
   }
   ```

3. Add Pydantic model in `main.py` if needed:
   ```python
   class MyNodeData(BaseModel):
       field1: str
       field2: int = 0
   ```

4. Update `Node.data` union type.

### Frontend

1. Create component in `frontend/app/components/workflow/nodes/MyNode.tsx`
2. Export from `nodes/index.ts`
3. Add to `NODE_CONFIGS` in `nodeConfig.ts`:
   ```typescript
   my_node: {
     frontendType: "my_node",
     backendType: "my_node",    // must match backend handler key
     label: "My Node",
     ...
   }
   ```
4. Import in `WorkflowCanvas.tsx` and add to `nodeTypes` object.

---

## Debugging

### Backend logs

Logs are printed to stdout with timestamps:

```
2026-05-09 00:42:00 - workflow_engine - INFO - [exec_xxx] Starting workflow execution
2026-05-09 00:42:01 - workflow_engine - INFO - [exec_xxx] [input_1] Reading file: uploaded_file.pdf
2026-05-09 00:42:02 - workflow_engine - INFO - [exec_xxx] [llm_1] Calling Claude with model claude-haiku-4-5
```

### Frontend logs

Open browser DevTools → Console. The canvas logs:
- "Sending workflow:" — the JSON sent to backend on execution
- "Workflow error:" — caught exceptions

### API testing with curl

```bash
# Health check
curl http://localhost:8000/

# List workflows
curl http://localhost:8000/api/workflows

# Upload a file
curl -X POST http://localhost:8000/api/files \
  -F "file=@docs/sample.pdf"

# Start execution
curl -X POST http://localhost:8000/api/executions \
  -H "Content-Type: application/json" \
  -d '{"workflow": {"nodes": [...], "edges": [...]}}'

# Poll execution
curl http://localhost:8000/api/executions/{id}

# Cancel execution
curl -X DELETE http://localhost:8000/api/executions/{id}

# Download output
curl -O http://localhost:8000/api/executions/{id}/download
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| `pip install` fails on PyMuPDF | Install separately: `pip install PyMuPDF` |
| CORS errors in browser | Ensure backend is on port 8000, CORS whitelist includes localhost:3000 |
| LLM calls all fail | Check `OCTANE_API_KEY` in `backend/.env` |
| Frontend can't connect to backend | Check `NEXT_PUBLIC_API_URL` in `.env.local` (default: http://localhost:8000) |
| Tests fail with "module not found" | Run from `backend/` directory with venv activated |
| Uploaded file not found | Files stored in `backend/uploads/` — check the directory exists |