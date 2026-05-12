# Feature F005 — Load Workflow Modal

**Date Created:** 2026-05-10
**Status:** Pending
**Author:** AI Agent
**Version:** v0.1

---

## Requirements

### User Stories

1. **As a user**, I want to browse my saved workflows in a modal so that I can select one to load onto the canvas.
2. **As a user**, I want to see workflow metadata (name, description, node count, date) so that I can identify the right workflow.

### Functional Requirements

- **FR1:** "Load" toolbar button opens a modal
- **FR2:** Modal fetches all saved workflows from `GET /api/workflows`
- **FR3:** Displays them as clickable cards with name, description, node count, creation date
- **FR4:** Clicking a card loads the workflow onto the canvas

### Non-Functional Requirements

- **NFR1:** Modal must fetch workflow list on open (not on page load)
- **NFR2:** Empty workflow list must show a clear "No saved workflows" message
- **NFR3:** Loading a workflow replaces the current canvas content

---

## Planning

**Problem:** Users could save workflows but had no UI to browse and restore them.

**Solution:** `showLoadModal` state → `useEffect` calls `fetchWorkflows()` → render cards → `loadWorkflow(id)` on click.

---

## Implementation Details

**Files changed:**
- `frontend/app/components/workflow/WorkflowCanvas.tsx`

**State:** `availableWorkflows[]` — fetched from `GET /api/workflows` when modal opens.

**Key functions:**
- `fetchWorkflows()` — `GET /api/workflows` → set `availableWorkflows`
- `loadWorkflow(id)` — `GET /api/workflows/{id}` → convert backend→frontend types → `setNodes()`/`setEdges()`/`setWorkflowId()`

**Modal UI:** Cards with border, name (bold), description, "X nodes · Y edges" badge, created date.

---

## Acceptance Criteria

- [ ] "Load" toolbar button opens the load workflow modal
- [ ] Modal fetches saved workflows from `GET /api/workflows` on open
- [ ] Workflows are displayed as clickable cards showing name, description, node count, and creation date
- [ ] Clicking a workflow card loads it onto the canvas
- [ ] Empty workflow list shows "No saved workflows" message
- [ ] Loading a workflow sets the correct `workflowId`

---

## Test Cases

### Test 1: Open Load Modal with Saved Workflows
**Steps:** Save one or more workflows, click "Load" toolbar button.
**Expected:** Modal opens showing workflow cards with name, description, node count, and date.

### Test 2: Load a Workflow from Modal
**Steps:** Click a workflow card in the Load modal.
**Expected:** Canvas is populated with the selected workflow's nodes and edges, `workflowId` is set.

### Test 3: Empty Workflow List
**Steps:** With no saved workflows, click "Load" toolbar button.
**Expected:** Modal opens with "No saved workflows" message.

---

## Caveats/TODOs

- The modal does not show a preview of the workflow graph (just metadata)
- No search/filter on the workflow list
- If backend has no workflows, modal shows "No saved workflows" with no action

---

## Files Modified

- `frontend/app/components/workflow/WorkflowCanvas.tsx` — Added `showLoadModal` state, `fetchWorkflows()`, `loadWorkflow()` functions, modal UI with workflow cards
