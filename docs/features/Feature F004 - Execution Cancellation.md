# Feature F004 — Execution Cancellation

**Date Created:** 2026-05-10
**Status:** Pending
**Author:** AI Agent
**Version:** v0.1

---

## Requirements

### User Stories

1. **As a user**, I want to cancel a running workflow execution so that I can stop long-running or misconfigured workflows without waiting for them to finish.
2. **As a user**, I want the Run button to become a Cancel button while a workflow is executing so that I have a clear way to stop execution.

### Functional Requirements

- **FR1:** Users can cancel a running workflow execution
- **FR2:** Backend: `DELETE /api/executions/{id}` sets status to `cancelled`
- **FR3:** Frontend: Run button becomes "Cancel" button while executing
- **FR4:** Cancel stops the polling and resets execution state

### Non-Functional Requirements

- **NFR1:** Cancellation must be cooperative — execution checks cancellation flag between nodes
- **NFR2:** Already-completed nodes must not be rolled back
- **NFR3:** Cancel feedback must be immediate in the UI (button state change)

---

## Planning

**Problem:** Long-running workflows (especially with LLM calls) have no escape hatch — user was stuck waiting.

**Solution:**
- Backend: `DELETE /api/executions/{id}` → set status to `cancelled`; recursive execution checks flag and raises `CancelledError`
- Frontend: toggle Run→Cancel button; `cancelExecution()` sends DELETE, clears interval

---

## Implementation Details

**Files changed:**
- `backend/main.py` — `DELETE /api/executions/{id}` route + cancellation flag check in execution loop
- `frontend/app/components/workflow/WorkflowCanvas.tsx` — `cancelExecution()` function, button state toggle

**Backend behavior:** `executions[id].status = "cancelled"`. The recursive `execute_node_recursive` checks `executions[execution_id].status` before each node and raises `CancelledError` if cancelled.

**Frontend behavior:** Run button becomes red "Cancel" button (`isExecuting ? "Cancel" : "Run"`). `cancelExecution()` → DELETE → `clearInterval(pollingIntervalRef)` → reset all execution state.

---

## Acceptance Criteria

- [ ] `DELETE /api/executions/{id}` endpoint sets execution status to `cancelled`
- [ ] Run button becomes "Cancel" button while a workflow is executing
- [ ] Clicking Cancel sends DELETE request, clears polling interval, and resets execution state
- [ ] Backend checks cancellation flag before each node and raises `CancelledError` if cancelled
- [ ] Already-completed nodes are not rolled back on cancellation

---

## Test Cases

### Test 1: Cancel Running Execution
**Steps:** Start a long-running workflow, click Cancel button.
**Expected:** DELETE request sent, polling stops, execution state resets, button reverts to "Run".

### Test 2: Backend Cancellation Flag
**Steps:** Start execution, call `DELETE /api/executions/{id}`, observe execution logs.
**Expected:** Backend sets status to `cancelled`, `CancelledError` raised before next node execution.

### Test 3: Already-Completed Nodes Preserved
**Steps:** Start execution with multiple nodes, cancel after some nodes complete.
**Expected:** Completed node outputs remain available; only remaining nodes are skipped.

---

## Caveats/TODOs

- Cancel is cooperative — if a node is mid-execution (e.g., LLM call in progress), it may not stop immediately
- Already-completed nodes are not rolled back
- No force-kill mechanism

---

## Files Modified

- `backend/main.py` — Added `DELETE /api/executions/{id}` route and cancellation flag check in execution loop

- `frontend/app/components/workflow/WorkflowCanvas.tsx` — Added `cancelExecution()` function, Run/Cancel button state toggle
