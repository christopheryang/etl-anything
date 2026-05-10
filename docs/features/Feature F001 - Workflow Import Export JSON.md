# Feature F001 — Workflow Import/Export JSON

**Status:** Partial


> **Note:** Partially implemented. See implementation details below.**Feature ID:** F001

---

## Requirements

- Users can export the current canvas workflow as a `.json` file download
- Users can import a previously-exported JSON workflow file onto the canvas
- Import validates that the file contains `nodes` and `edges` arrays
- Import maps backend node types back to frontend types

---

## Planning

**Problem:** No way to save/restore a workflow canvas as a portable file (only save-to-server exists).

**Solution:**
- `exportWorkflow()` — serialize `{ name, nodes, edges }` to JSON, trigger browser download via hidden `<a>` tag with `URL.createObjectURL`
- `importWorkflow(event)` — FileReader reads `.json`, parse, validate structure, call `setNodes()` + `setEdges()`

**Toolbar placement:** Export (download icon) and Import (upload icon) buttons in the right-side toolbar group.

---

## Implementation Summary

**Files changed:**
- `frontend/app/components/workflow/WorkflowCanvas.tsx`

**Key functions:**
- `exportWorkflow()` — Blob → JSON → anchor click → revoke
- `importWorkflow(event)` — FileReader → JSON.parse → validate → `setNodes()`/`setEdges()`
- Toolbar buttons: Download icon (export) and Upload icon (import)

**Import mapping:** `reverseNodeMap` converts backend types (input→input, llm→reasoning, output→output, rule→rule).

---

## Caveats

- The JSON export does not include the workflow ID (it's for portable sharing, not resuming a saved workflow)
- Import replaces all current nodes/edges without confirmation
- No schema validation on imported JSON beyond checking for `nodes` and `edges` arrays