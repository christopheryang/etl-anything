# Feature F020 — Help Modal with Keyboard Shortcuts

**Status:** Pending (not implemented)

---

## Requirements

- **FR1:** Help button (question mark / HelpCircle icon) in the toolbar
- **FR2:** Opens a modal overlay listing all keyboard shortcuts and canvas features
- **FR3:** Modal can be closed with Escape or clicking outside
- **NFR1:** No breaking changes to existing functionality

---

## Planning

**Problem:** Power users don't know all available shortcuts — no discoverable reference in the UI.

**Solution:** `showHelp: boolean` state. Modal JSX renders shortcuts table. Close on Escape key or backdrop click.

---

## Implementation

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

## Acceptance Criteria

- [ ] **FR1:** Help button (question mark / HelpCircle icon) in the toolbar
- [ ] **FR2:** Opens a modal overlay listing all keyboard shortcuts and canvas features
- [ ] **FR3:** Modal can be closed with Escape or clicking outside
- [ ] **NFR1:** No breaking changes to existing functionality

---

## Test Cases

- Verify feature works per requirements
- Run `cd backend && source venv/bin/activate && python -m pytest tests/ -q`
- Run `cd frontend && npx -p typescript tsc --noEmit`

---

## Caveats

- Help content needs to be kept in sync with actual shortcut implementation — mismatches will confuse users
- No keyboard shortcut yet assigned to open the help modal (Ctrl+? or F1)

---

## Files Modified
