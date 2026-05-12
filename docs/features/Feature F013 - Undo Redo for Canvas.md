# Feature F013 — Undo/Redo for Canvas

**Status:** Pending (not implemented)

---

## Requirements

- **FR1:** Undo and redo buttons in toolbar (Undo2/Redo2 icons)
- **FR2:** Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Shift+Z / Ctrl+Y (redo)
- **FR3:** Uses ReactFlow's built-in history (no custom state management needed)
- **NFR1:** No breaking changes to existing functionality

---

## Planning

**Problem:** No way to revert accidental node deletions or moves — user had to manually re-do work.

**Solution:** ReactFlow exposes `undo()` and `redo()` on the `reactFlow` instance. Cast to `any` to bypass TypeScript strictness.

---

## Implementation

**Files changed:**
- `frontend/app/components/workflow/WorkflowCanvas.tsx`

**Buttons:** Undo2 (left of Redo), Redo2 (between Undo and AutoLayout).

**Implementation:** `(reactFlow as any).undo()` / `(reactFlow as any).redo()`. ReactFlow internal history tracks all node/edge changes automatically.

**Keyboard:** Ctrl+Z → undo, Ctrl+Shift+Z / Ctrl+Y → redo (same handler for both).

---

## Acceptance Criteria

- [ ] **FR1:** Undo and redo buttons in toolbar (Undo2/Redo2 icons)
- [ ] **FR2:** Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Shift+Z / Ctrl+Y (redo)
- [ ] **FR3:** Uses ReactFlow's built-in history (no custom state management needed)
- [ ] **NFR1:** No breaking changes to existing functionality

---

## Test Cases

- Verify feature works per requirements
- Run `cd backend && source venv/bin/activate && python -m pytest tests/ -q`
- Run `cd frontend && npx -p typescript tsc --noEmit`

---

## Caveats

- History is ReactFlow-internal — clearing nodes (`setNodes([])`) does NOT integrate with undo/redo (manual clear via `clearWorkflow()` resets history)
- No visual indication of undo/redo stack depth

---

## Files Modified

- `frontend/app/components/workflow/WorkflowCanvas.tsx`
