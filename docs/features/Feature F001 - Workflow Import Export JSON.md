# Feature F001 — Workflow Import/Export JSON

**Date Created:** 2026-05-10
**Status:** Partial
**Author:** AI Agent
**Version:** v0.1

---

## Requirements

### User Stories

1. **As a user**, I want to export my current canvas workflow as a `.json` file so that I can share it with others or back it up locally.
2. **As a user**, I want to import a previously-exported JSON workflow file onto the canvas so that I can restore a saved workflow.
3. **As a user**, I want imported files to be validated so that invalid files don't corrupt my canvas.

### Functional Requirements

- **FR1:** Users can export the current canvas workflow as a `.json` file download
- **FR2:** Users can import a previously-exported JSON workflow file onto the canvas
- **FR3:** Import validates that the file contains `nodes` and `edges` arrays
- **FR4:** Import maps backend node types back to frontend types

### Non-Functional Requirements

- **NFR1:** Exported JSON must be portable and self-contained (no server-side dependencies)
- **NFR2:** Import must validate file structure before modifying the canvas
- **NFR3:** No data loss during export/import round-trip for supported node types

---

## Planning

**Problem:** No way to save/restore a workflow canvas as a portable file (only save-to-server exists).

**Solution:**
- `exportWorkflow()` — serialize `{ name, nodes, edges }` to JSON, trigger browser download via hidden `<a>` tag with `URL.createObjectURL`
- `importWorkflow(event)` — FileReader reads `.json`, parse, validate structure, call `setNodes()` + `setEdges()`

**Toolbar placement:** Export (download icon) and Import (upload icon) buttons in the right-side toolbar group.

---

## Implementation Details

**Files changed:**
- `frontend/app/components/workflow/WorkflowCanvas.tsx`

**Key functions:**
- `exportWorkflow()` — Blob → JSON → anchor click → revoke
- `importWorkflow(event)` — FileReader → JSON.parse → validate → `setNodes()`/`setEdges()`
- Toolbar buttons: Download icon (export) and Upload icon (import)

**Import mapping:** `reverseNodeMap` converts backend types (input→input, llm→reasoning, output→output, rule→rule).

---

## Acceptance Criteria

- [ ] Users can click Export to download the current workflow as a `.json` file
- [ ] Users can click Import to load a `.json` workflow file onto the canvas
- [ ] Import rejects files that do not contain `nodes` and `edges` arrays
- [ ] Import correctly maps backend node types to frontend node types
- [ ] Exported JSON includes workflow name, nodes, and edges
- [ ] Toolbar shows Export (download icon) and Import (upload icon) buttons

---

## Test Cases

### Test 1: Export Workflow
**Steps:** Create a workflow with multiple nodes and edges, click Export button.
**Expected:** A `.json` file is downloaded containing `{ name, nodes, edges }` matching the current canvas state.

### Test 2: Import Valid Workflow
**Steps:** Click Import, select a previously exported `.json` file containing `nodes` and `edges` arrays.
**Expected:** Canvas is populated with the nodes and edges from the file, with backend types mapped to frontend types.

### Test 3: Import Invalid File
**Steps:** Click Import, select a `.json` file missing `nodes` or `edges` arrays.
**Expected:** Import is rejected and canvas remains unchanged.

---

## Caveats/TODOs

- The JSON export does not include the workflow ID (it's for portable sharing, not resuming a saved workflow)
- Import replaces all current nodes/edges without confirmation
- No schema validation on imported JSON beyond checking for `nodes` and `edges` arrays

---

## Files Modified

- `frontend/app/components/workflow/WorkflowCanvas.tsx` — Added `exportWorkflow()` and `importWorkflow()` functions, toolbar Export/Import buttons
