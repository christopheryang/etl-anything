# Feature F004 — Execution Cancellation

**Status:** Pending (not implemented)


> **Note:** This feature was documented but never implemented in the UI.**Feature ID:** F004

---

## Requirements

- Users can cancel a running workflow execution
- Backend: `DELETE /api/executions/{id}` sets status to `cancelled`
- Frontend: Run button becomes "Cancel" button while executing
- Cancel stops the polling and resets execution state

---

## Planning

**Problem:** Long-running workflows (especially with LLM calls) have no escape hatch — user was stuck waiting.

**Solution:**
- Backend: `DELETE /api/executions/{id}` → set status to `cancelled`; recursive execution checks flag and raises `CancelledError`
- Frontend: toggle Run→Cancel button; `cancelExecution()` sends DELETE, clears interval

---

## Implementation Summary

**Files changed:**
- `backend/main.py` — `DELETE /api/executions/{id}` route + cancellation flag check in execution loop
- `frontend/app/components/workflow/WorkflowCanvas.tsx` — `cancelExecution()` function, button state toggle

**Backend behavior:** `executions[id].status = "cancelled"`. The recursive `execute_node_recursive` checks `executions[execution_id].status` before each node and raises `CancelledError` if cancelled.

**Frontend behavior:** Run button becomes red "Cancel" button (`isExecuting ? "Cancel" : "Run"`). `cancelExecution()` → DELETE → `clearInterval(pollingIntervalRef)` → reset all execution state.

---

## Caveats

- Cancel is cooperative — if a node is mid-execution (e.g., LLM call in progress), it may not stop immediately
- Already-completed nodes are not rolled back
- No force-kill mechanism