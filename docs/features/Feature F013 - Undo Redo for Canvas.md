# Feature F013 — Undo/Redo for Canvas

**Status:** Pending (not implemented)


> **Note:** This feature was documented but never implemented in the UI.**Feature ID:** F013

---

## Requirements

- Undo and redo buttons in toolbar (Undo2/Redo2 icons)
- Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Shift+Z / Ctrl+Y (redo)
- Uses ReactFlow's built-in history (no custom state management needed)

---

## Planning

**Problem:** No way to revert accidental node deletions or moves — user had to manually re-do work.

**Solution:** ReactFlow exposes `undo()` and `redo()` on the `reactFlow` instance. Cast to `any` to bypass TypeScript strictness.

---

## Implementation Summary

**Files changed:**
- `frontend/app/components/workflow/WorkflowCanvas.tsx`

**Buttons:** Undo2 (left of Redo), Redo2 (between Undo and AutoLayout).

**Implementation:** `(reactFlow as any).undo()` / `(reactFlow as any).redo()`. ReactFlow internal history tracks all node/edge changes automatically.

**Keyboard:** Ctrl+Z → undo, Ctrl+Shift+Z / Ctrl+Y → redo (same handler for both).

---

## Caveats

- History is ReactFlow-internal — clearing nodes (`setNodes([])`) does NOT integrate with undo/redo (manual clear via `clearWorkflow()` resets history)
- No visual indication of undo/redo stack depth