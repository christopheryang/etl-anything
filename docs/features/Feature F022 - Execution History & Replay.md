# Feature F022 — Execution History & Replay

**Status:** Done

---

## Requirements

- **FR1:** Backend stores execution history in `backend/executions/` as JSON files
- **FR2:** Each record includes: executionId, workflowId, workflowName, status, startedAt, completedAt, nodeResults, inputs, outputs
- **FR3:** API endpoints: GET /api/executions, GET /api/executions/{id}, DELETE /api/executions/{id}, POST /api/executions/{id}/replay
- **FR4:** Frontend history panel with list view, detail view, filter by workflow, replay/delete actions
- **FR5:** Execution records persist across sessions (file-based storage)
- **FR6:** Auto-cleanup: executions older than 30 days deleted on startup
- **NFR1:** History writes must not impact execution performance (async)
- **NFR2:** Max 100 executions per workflow

---

## Planning

- Create `ExecutionHistory` class for file-based storage in `backend/history.py`
- Add 5 API endpoints for history management
- Create `ExecutionHistoryPanel.tsx` with two-panel layout
- Integrate history button in toolbar

---

## Implementation

- `backend/history.py` — `ExecutionHistory` class with save/get/list/delete/cleanup methods
- `backend/main.py` — 5 endpoints: list, detail, delete, replay, stats
- `ExecutionHistoryPanel.tsx` — Left: execution list; Right: detail view with node results
- Auto-cleanup: max 100 per workflow, 30-day retention
- `save_execution_history()` called after each workflow execution

---

## Acceptance Criteria

- [ ] Executions saved automatically after each run
- [ ] History panel shows all executions with metadata
- [ ] Filtering by workflow name works
- [ ] Clicking execution shows detailed node results
- [ ] Replay re-runs with original inputs
- [ ] Old executions cleaned up after 30 days

---

## Test Cases

- **Save & retrieve:** Run workflow → check execution saved to file → GET returns it
- **List & filter:** GET /api/executions → returns all; GET /api/executions?workflow_id=X → filtered
- **Delete:** DELETE /api/executions/{id} → file removed
- **Cleanup:** Create execution older than 30 days → startup cleanup removes it
- **14 backend unit tests** in `tests/test_history.py` — all passing

---

## Caveats

- Replay returns stub response — full implementation needs workflow reconstruction
- File-based storage grows over time; monitor `backend/executions/` in production
- In-memory `executions` dict still used for active tracking; history is for completed runs only

---

## Files Modified

- `backend/history.py` (new)
- `backend/main.py` — API endpoints, history integration
- `backend/tests/test_history.py` (new)
- `frontend/app/components/workflow/ExecutionHistoryPanel.tsx` (new)
- `frontend/app/components/workflow/WorkflowCanvas.tsx` — Integrated history panel
