# Feature F016 — MiniMap Toggle Button

**Status:** Done
**Feature ID:** F016

---

## Requirements

- Toggle button shows/hides the ReactFlow MiniMap panel
- Button shows Map icon; active state when MiniMap is visible
- State persists during session (not saved to storage)

---

## Planning

**Problem:** MiniMap was always visible and could not be hidden -- took up canvas space on smaller screens.

**Solution:** `showMiniMap: boolean` state controls conditional render of `<MiniMap>`. Button moved to Settings menu dropdown.

---

## Implementation Summary

**Files changed:**
- `frontend/app/components/workflow/WorkflowCanvas.tsx`

**State:** `showMiniMap: boolean` (default `true` -- MiniMap visible on startup).

**Render:** `{showMiniMap && <MiniMap ... />}`

**Toggle location:** Settings menu dropdown (Menu/hamburger icon in header, far right). Clicking "MiniMap" toggles on/off and auto-closes the dropdown. The button in the Settings menu shows current state ("On" in teal or "Off" in gray).

---

## Caveats

- MiniMap node color is derived from `NODE_CONFIGS[node.type].color` -- if a node type is added without a color, it defaults to `#6b7280`
- The toggle state is session-only -- refreshing the page resets to visible
- In header, the Settings menu is the rightmost element (zoom controls --> Run Workflow --> Save --> Settings)