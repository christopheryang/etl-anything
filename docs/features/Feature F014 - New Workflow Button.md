# Feature F014 — New Workflow Button (Clear Canvas)

**Status:** Pending (not implemented)


> **Note:** This feature was documented but never implemented in the UI.**Feature ID:** F014

---

## Requirements

- "New" button in toolbar clears the canvas with confirmation if there are nodes
- Resets all state: nodes, edges, workflow name, workflow ID, execution state
- Keyboard shortcut: Ctrl+N

---

## Planning

**Problem:** No quick way to start a fresh workflow — user had to manually delete all nodes.

**Solution:** `clearWorkflow()` function with confirmation guard. FilePlus icon button.

---

## Implementation Summary

**Files changed:**
- `frontend/app/components/workflow/WorkflowCanvas.tsx`

**`clearWorkflow()` resets:** `setNodes([])`, `setEdges([])`, `workflowName="Untitled Workflow"`, `workflowId=null`, `workflowDescription=""`, `workflowStatus="idle"`, `isExecuting=false`, `progress=0`, `executionLogs=[]`.

**Confirmation:** `if (nodes.length > 0 && !confirm(...)) return`

**Button:** FilePlus icon, leftmost in toolbar. Label "New".

**Shortcut:** Ctrl+N → `clearWorkflow()` (same handler as button).

---

## Caveats

- `clearWorkflow` does NOT call ReactFlow's `undo` — it directly calls `setNodes([])`, so the clear itself is not undoable
- Confirmation dialog is browser native — no custom modal