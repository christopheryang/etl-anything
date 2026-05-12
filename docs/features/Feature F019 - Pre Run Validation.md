# Feature F019 — Pre-Run Validation

**Status:** Partial

---

## Requirements

- **FR1:** Before a workflow executes, validate: canvas has nodes, canvas has edges, at least one Input node exists, all Input nodes have a file selected, at least one Output node exists
- **FR2:** Show a specific, actionable error message for each failure
- **NFR1:** No breaking changes to existing functionality

---

## Planning

**Problem:** Submitting an invalid workflow to the backend produced confusing errors. Better to validate upfront with clear messages.

**Solution:** `runWorkflow()` starts with a series of `if` checks. Each failure triggers `alert()` + `return`.

---

## Implementation

**Files changed:**
- `frontend/app/components/workflow/WorkflowCanvas.tsx`

**Checks (in order):**
1. `nodes.length === 0` → "Add some nodes to the canvas first."
2. `edges.length === 0` → "Connect some nodes together first."
3. No node with `type === "input"` → "Add at least one Input node to provide data to the workflow."
4. Any input node without `data.fileId` → "Please select a file for all Input nodes. {N} Input node(s) are missing a file."
5. No node with `type === "output"` → "Add at least one Output node to save the workflow result."

---

## Acceptance Criteria

- [ ] **FR1:** Before a workflow executes, validate: canvas has nodes, canvas has edges, at least one Input node exists, all Input nodes have a file selected, at least one Output node exists
- [ ] **FR2:** Show a specific, actionable error message for each failure
- [ ] **NFR1:** No breaking changes to existing functionality

---

## Test Cases

- Verify feature works per requirements
- Run `cd backend && source venv/bin/activate && python -m pytest tests/ -q`
- Run `cd frontend && npx -p typescript tsc --noEmit`

---

## Caveats

- Validation is synchronous and client-side only — server-side validation may still catch edge cases
- Error messages use `alert()` — blocking and ugly (see F21: Toast notifications)

---

## Files Modified

- `frontend/app/components/workflow/WorkflowCanvas.tsx`
