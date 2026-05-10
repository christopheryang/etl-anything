# Feature F010 — Keyboard Shortcuts

**Status:** Pending (not implemented)


> **Note:** This feature was documented but never implemented in the UI.**Feature ID:** F010

---

## Requirements

- Full keyboard shortcut system via global `keydown` listener
- Shortcuts: Ctrl+S (Save), Ctrl+O (Load), Ctrl+N (New), Ctrl+Z (Undo), Ctrl+Shift+Z/Ctrl+Y (Redo), Delete/Backspace (Delete selected)
- Shortcuts skip when user is typing in an input/textarea

---

## Planning

**Problem:** No keyboard navigation — all actions required mouse, slow for power users.

**Solution:** Single `useEffect` with `window.addEventListener("keydown", handleKeyDown)` in WorkflowCanvas.

---

## Implementation Summary

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

## Caveats

- No shortcut for "Run" (Enter key was considered but conflicts with form submission)
- The Delete handler does not ask for confirmation (undo via Ctrl+Z available)