# Feature F019 — Pre-Run Validation

**Status:** Partial


> **Note:** Partially implemented. See implementation details below.**Feature ID:** F019

---

## Requirements

- Before a workflow executes, validate: canvas has nodes, canvas has edges, at least one Input node exists, all Input nodes have a file selected, at least one Output node exists
- Show a specific, actionable error message for each failure

---

## Planning

**Problem:** Submitting an invalid workflow to the backend produced confusing errors. Better to validate upfront with clear messages.

**Solution:** `runWorkflow()` starts with a series of `if` checks. Each failure triggers `alert()` + `return`.

---

## Implementation Summary

**Files changed:**
- `frontend/app/components/workflow/WorkflowCanvas.tsx`

**Checks (in order):**
1. `nodes.length === 0` → "Add some nodes to the canvas first."
2. `edges.length === 0` → "Connect some nodes together first."
3. No node with `type === "input"` → "Add at least one Input node to provide data to the workflow."
4. Any input node without `data.fileId` → "Please select a file for all Input nodes. {N} Input node(s) are missing a file."
5. No node with `type === "output"` → "Add at least one Output node to save the workflow result."

---

## Caveats

- Validation is synchronous and client-side only — server-side validation may still catch edge cases
- Error messages use `alert()` — blocking and ugly (see F21: Toast notifications)