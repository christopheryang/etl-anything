# Feature F020 — Help Modal with Keyboard Shortcuts

**Status:** Pending (not implemented)


> **Note:** This feature was documented but never implemented in the UI.**Feature ID:** F020

---

## Requirements

- Help button (question mark / HelpCircle icon) in the toolbar
- Opens a modal overlay listing all keyboard shortcuts and canvas features
- Modal can be closed with Escape or clicking outside

---

## Planning

**Problem:** Power users don't know all available shortcuts — no discoverable reference in the UI.

**Solution:** `showHelp: boolean` state. Modal JSX renders shortcuts table. Close on Escape key or backdrop click.

---

## Implementation Summary

**Status:** Pending (not implemented)

**Files changed:** `frontend/app/components/workflow/WorkflowCanvas.tsx`

**Details:**
- `showHelp: boolean` state declared at line 64
- `HelpCircle` icon imported from lucide-react
- Help button added to header toolbar (right of Logs button)
- Help modal JSX renders 3 sections: Keyboard Shortcuts, Canvas Features, Node Types
- Escape key closes modal (keyboard handler at line ~198)
- `?` key opens modal when not typing in an input/textarea
- Delete/Backspace shortcut blocked when help modal is open

---

## Caveats

- Help content needs to be kept in sync with actual shortcut implementation — mismatches will confuse users
- No keyboard shortcut yet assigned to open the help modal (Ctrl+? or F1)