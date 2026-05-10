# Feature F005 — Load Workflow Modal

**Status:** Pending (not implemented)


> **Note:** This feature was documented but never implemented in the UI.**Feature ID:** F005

---

## Requirements

- "Load" toolbar button opens a modal
- Modal fetches all saved workflows from `GET /api/workflows`
- Displays them as clickable cards with name, description, node count, creation date
- Clicking a card loads the workflow onto the canvas

---

## Planning

**Problem:** Users could save workflows but had no UI to browse and restore them.

**Solution:** `showLoadModal` state → `useEffect` calls `fetchWorkflows()` → render cards → `loadWorkflow(id)` on click.

---

## Implementation Summary

**Files changed:**
- `frontend/app/components/workflow/WorkflowCanvas.tsx`

**State:** `availableWorkflows[]` — fetched from `GET /api/workflows` when modal opens.

**Key functions:**
- `fetchWorkflows()` — `GET /api/workflows` → set `availableWorkflows`
- `loadWorkflow(id)` — `GET /api/workflows/{id}` → convert backend→frontend types → `setNodes()`/`setEdges()`/`setWorkflowId()`

**Modal UI:** Cards with border, name (bold), description, "X nodes · Y edges" badge, created date.

---

## Caveats

- The modal does not show a preview of the workflow graph (just metadata)
- No search/filter on the workflow list
- If backend has no workflows, modal shows "No saved workflows" with no action