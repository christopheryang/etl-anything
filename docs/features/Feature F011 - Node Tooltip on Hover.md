# Feature F011 — Node Tooltip on Hover

**Status:** Pending (not implemented)


> **Note:** This feature was documented but never implemented in the UI.**Feature ID:** F011

---

## Requirements

- Floating tooltip appears on node hover
- Shows node type, key configuration values (model, file name, conditions count, etc.)
- Tooltip follows cursor and avoids getting clipped at viewport edges

---

## Planning

**Problem:** Users can't see node configuration without clicking into each node — especially tedious when reviewing complex workflows.

**Solution:** `hoveredNode` state tracks `{id, x, y, info}`. `onNodeMouseEnter` sets it, `onNodeMouseLeave` clears it. `getNodeTooltipInfo(node)` builds the summary string.

---

## Implementation Summary

**Files changed:**
- `frontend/app/components/workflow/WorkflowCanvas.tsx`

**Tooltip content per node type:**
- **Input:** `"Input: {fileName}"` or `"Input: (no file)"`
- **Reasoning:** `"Reasoning: {model}, temp={temp}, sysPrompt={yes/no}"`
- **Output:** `"Output: {fileName}.{format}"`
- **Rule:** `"Rule: {conditionCount} conditions, {AND/OR}"`

**Positioning:** Fixed-position div, `left: mouseX + 10px`, `top: mouseY + 10px`. CSS: max-width 240px, dark bg, small text, shadow, rounded.

---

## Caveats

- If node has many properties, the tooltip may truncate
- No keyboard-accessible alternative (tooltip requires hover)
- Position can overflow viewport on small screens — no boundary clamping