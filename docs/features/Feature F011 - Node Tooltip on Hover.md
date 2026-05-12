# Feature F011 — Node Tooltip on Hover

**Status:** Pending (not implemented)

---

## Requirements

- **FR1:** Floating tooltip appears on node hover
- **FR2:** Shows node type, key configuration values (model, file name, conditions count, etc.)
- **FR3:** Tooltip follows cursor and avoids getting clipped at viewport edges
- **NFR1:** No breaking changes to existing functionality

---

## Planning

**Problem:** Users can't see node configuration without clicking into each node — especially tedious when reviewing complex workflows.

**Solution:** `hoveredNode` state tracks `{id, x, y, info}`. `onNodeMouseEnter` sets it, `onNodeMouseLeave` clears it. `getNodeTooltipInfo(node)` builds the summary string.

---

## Implementation

**Files changed:**
- `frontend/app/components/workflow/WorkflowCanvas.tsx`

**Tooltip content per node type:**
- **Input:** `"Input: {fileName}"` or `"Input: (no file)"`
- **Reasoning:** `"Reasoning: {model}, temp={temp}, sysPrompt={yes/no}"`
- **Output:** `"Output: {fileName}.{format}"`
- **Rule:** `"Rule: {conditionCount} conditions, {AND/OR}"`

**Positioning:** Fixed-position div, `left: mouseX + 10px`, `top: mouseY + 10px`. CSS: max-width 240px, dark bg, small text, shadow, rounded.

---

## Acceptance Criteria

- [ ] **FR1:** Floating tooltip appears on node hover
- [ ] **FR2:** Shows node type, key configuration values (model, file name, conditions count, etc.)
- [ ] **FR3:** Tooltip follows cursor and avoids getting clipped at viewport edges
- [ ] **NFR1:** No breaking changes to existing functionality

---

## Test Cases

- Verify feature works per requirements
- Run `cd backend && source venv/bin/activate && python -m pytest tests/ -q`
- Run `cd frontend && npx -p typescript tsc --noEmit`

---

## Caveats

- If node has many properties, the tooltip may truncate
- No keyboard-accessible alternative (tooltip requires hover)
- Position can overflow viewport on small screens — no boundary clamping

---

## Files Modified

- `frontend/app/components/workflow/WorkflowCanvas.tsx`
