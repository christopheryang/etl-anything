# Feature F021 — Toast Notifications Instead of alert()

**Status:** Pending (not implemented)

---

## Requirements

- **FR1:** Replace all `alert()` calls in WorkflowCanvas with a toast/notification system
- **FR2:** Toasts should appear in a fixed position (e.g., top-right or bottom-right)
- **FR3:** Non-blocking: user can continue interacting with the canvas while toasts are visible
- **FR4:** Auto-dismiss after a few seconds, or manually dismissible
- **FR5:** Distinct visual styles for success, error, warning, info
- **NFR1:** No breaking changes to existing functionality

---

## Planning

**Problem:** `alert()` is blocking, ugly, and disruptive — especially during workflow execution where multiple validation messages may appear.

**Solution:** Implement a simple toast container component. State holds toast messages array. `addToast(type, message)` helper function. Auto-remove after 4s via `setTimeout`.

**Libraries considered:**
- `react-hot-toast` — most popular, clean API
- `sonner` — modern, headless, tree-shakeable
- Custom CSS-only toast — zero dependencies

**Decision:** Use `sonner` (or custom) — lightweight and well-suited for Next.js.

---

## Implementation

**Status:** Pending (not implemented)

**Files changed:** `frontend/app/components/workflow/WorkflowCanvas.tsx`

**Details:**
- `toasts: {id, message, type}[]` state at line ~65, `toastIdRef` ref for unique IDs
- `showToast(message, type)` helper function — auto-dismisses after 4s
- All 12 `alert()` calls in WorkflowCanvas replaced with `showToast(..., "error")` or `showToast(..., "success")`
- Toast container fixed at `bottom-4 left-4` with `z-[9999]`, stacks vertically
- Success toasts: green bg with ✓ icon; Error: red bg with ✗ icon; Info: blue bg with ℹ icon
- `pointer-events-none` on container so clicks pass through to canvas
- No external toast library — pure CSS + React state, zero new dependencies

---

## Acceptance Criteria

- [ ] **FR1:** Replace all `alert()` calls in WorkflowCanvas with a toast/notification system
- [ ] **FR2:** Toasts should appear in a fixed position (e.g., top-right or bottom-right)
- [ ] **FR3:** Non-blocking: user can continue interacting with the canvas while toasts are visible
- [ ] **FR4:** Auto-dismiss after a few seconds, or manually dismissible
- [ ] **FR5:** Distinct visual styles for success, error, warning, info
- [ ] **NFR1:** No breaking changes to existing functionality

---

## Test Cases

- Verify feature works per requirements
- Run `cd backend && source venv/bin/activate && python -m pytest tests/ -q`
- Run `cd frontend && npx -p typescript tsc --noEmit`

---

## Caveats

- Toasts require a fixed-position container — ensure it doesn't overlap with ReactFlow canvas controls
- Multiple toasts stacking vertically need to be handled gracefully (max 3 visible, oldest dismissed)
- For workshop environment, keep toast animation minimal — reduces distraction

---

## Files Modified
