# Feature F015 — Delete Selected Nodes with Delete/Backspace

**Status:** Pending (not implemented)

---

## Requirements

- **FR1:** Pressing Delete or Backspace removes selected nodes AND all edges connected to them
- **FR2:** Skips when a modal is open or user is typing in an input/textarea
- **NFR1:** No breaking changes to existing functionality

---

## Planning

**Problem:** Delete key pressed in canvas did nothing (previously just `e.preventDefault()` with no action).

**Solution:** Filter `nodes` to remove selected, filter `edges` to remove any that connect to deleted nodes.

---

## Implementation

**Files changed:**
- `frontend/app/components/workflow/WorkflowCanvas.tsx`

**Logic:**
```typescript
const selectedNodeIds = nodes.filter((n) => n.selected).map((n) => n.id);
setNodes((nds) => nds.filter((n) => !n.selected));
setEdges((eds) => eds.filter(
  (ed) => !selectedNodeIds.includes(ed.source) && !selectedNodeIds.includes(ed.target)
));
```

**Skip conditions:** `showSaveModal || showLoadModal || isTypingInInput`

---

## Acceptance Criteria

- [ ] **FR1:** Pressing Delete or Backspace removes selected nodes AND all edges connected to them
- [ ] **FR2:** Skips when a modal is open or user is typing in an input/textarea
- [ ] **NFR1:** No breaking changes to existing functionality

---

## Test Cases

- Verify feature works per requirements
- Run `cd backend && source venv/bin/activate && python -m pytest tests/ -q`
- Run `cd frontend && npx -p typescript tsc --noEmit`

---

## Caveats

- No confirmation before delete (undo via Ctrl+Z available)
- If no nodes are selected, Delete does nothing (silent)
- Only selected nodes are deleted — edges attached to unselected nodes are preserved

---

## Files Modified

- `frontend/app/components/workflow/WorkflowCanvas.tsx`
