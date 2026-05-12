# Feature F010 — Keyboard Shortcuts

**Status:** Pending (not implemented)

---

## Requirements

- **FR1:** Full keyboard shortcut system via global `keydown` listener
- **FR2:** Shortcuts: Ctrl+S (Save), Ctrl+O (Load), Ctrl+N (New), Ctrl+Z (Undo), Ctrl+Shift+Z/Ctrl+Y (Redo), Delete/Backspace (Delete selected)
- **FR3:** Shortcuts skip when user is typing in an input/textarea
- **NFR1:** No breaking changes to existing functionality

---

## Planning

**Problem:** No keyboard navigation — all actions required mouse, slow for power users.

**Solution:** Single `useEffect` with `window.addEventListener("keydown", handleKeyDown)` in WorkflowCanvas.

---

## Implementation

**Files changed:**
- `frontend/app/components/workflow/WorkflowCanvas.tsx`

**Shortcuts implemented:**
| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd+S | Open Save modal |
| Ctrl/Cmd+O | Open Load modal |
| Ctrl/Cmd+N | Clear canvas |
| Ctrl/Cmd+Z | Undo |
| Ctrl/Cmd+Shift+Z / Ctrl+Y | Redo |
| Delete/Backspace | Delete selected nodes + edges |

**Skip condition:** `if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return`

**Delete implementation:** Filters `nodes` by `!n.selected`, filters `edges` to remove those connected to deleted nodes.

---

## Acceptance Criteria

- [ ] **FR1:** Full keyboard shortcut system via global `keydown` listener
- [ ] **FR2:** Shortcuts: Ctrl+S (Save), Ctrl+O (Load), Ctrl+N (New), Ctrl+Z (Undo), Ctrl+Shift+Z/Ctrl+Y (Redo), Delete/Backspace (Delete selected)
- [ ] **FR3:** Shortcuts skip when user is typing in an input/textarea
- [ ] **NFR1:** No breaking changes to existing functionality

---

## Test Cases

- Verify feature works per requirements
- Run `cd backend && source venv/bin/activate && python -m pytest tests/ -q`
- Run `cd frontend && npx -p typescript tsc --noEmit`

---

## Caveats

- No shortcut for "Run" (Enter key was considered but conflicts with form submission)
- The Delete handler does not ask for confirmation (undo via Ctrl+Z available)

---

## Files Modified

- `frontend/app/components/workflow/WorkflowCanvas.tsx`
