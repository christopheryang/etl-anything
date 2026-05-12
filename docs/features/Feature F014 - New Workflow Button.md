# Feature F014 — New Workflow Button

**Status:** Pending (not implemented)

---

## Requirements

- **FR1:** "New" button in toolbar clears the canvas with confirmation if there are nodes
- **FR2:** Resets all state: nodes, edges, workflow name, workflow ID, execution state
- **FR3:** Keyboard shortcut: Ctrl+N
- **NFR1:** No breaking changes to existing functionality

---

## Planning

**Problem:** No quick way to start a fresh workflow — user had to manually delete all nodes.

**Solution:** `clearWorkflow()` function with confirmation guard. FilePlus icon button.

---

## Implementation

**Files changed:**
- `frontend/app/components/workflow/WorkflowCanvas.tsx`

**`clearWorkflow()` resets:** `setNodes([])`, `setEdges([])`, `workflowName="Untitled Workflow"`, `workflowId=null`, `workflowDescription=""`, `workflowStatus="idle"`, `isExecuting=false`, `progress=0`, `executionLogs=[]`.

**Confirmation:** `if (nodes.length > 0 && !confirm(...)) return`

**Button:** FilePlus icon, leftmost in toolbar. Label "New".

**Shortcut:** Ctrl+N → `clearWorkflow()` (same handler as button).

---

## Acceptance Criteria

- [ ] **FR1:** "New" button in toolbar clears the canvas with confirmation if there are nodes
- [ ] **FR2:** Resets all state: nodes, edges, workflow name, workflow ID, execution state
- [ ] **FR3:** Keyboard shortcut: Ctrl+N
- [ ] **NFR1:** No breaking changes to existing functionality

---

## Test Cases

- Verify feature works per requirements
- Run `cd backend && source venv/bin/activate && python -m pytest tests/ -q`
- Run `cd frontend && npx -p typescript tsc --noEmit`

---

## Caveats

- `clearWorkflow` does NOT call ReactFlow's `undo` — it directly calls `setNodes([])`, so the clear itself is not undoable
- Confirmation dialog is browser native — no custom modal

---

## Files Modified

- `frontend/app/components/workflow/WorkflowCanvas.tsx`
