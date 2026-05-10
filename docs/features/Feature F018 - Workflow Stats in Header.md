# Feature F018 — Workflow Stats in Header

**Status:** Pending (not implemented)


> **Note:** This feature was documented but never implemented in the UI.**Feature ID:** F018

---

## Requirements

- Live node count and edge count displayed in the header bar
- Updates as nodes are added/removed/connected

---

## Planning

**Problem:** User has no at-a-glance view of workflow size — must manually count nodes/edges.

**Solution:** Inline `{nodes.length}` and `{edges.length}` JSX in the header, using plural singular form.

---

## Implementation Summary

**Files changed:**
- `frontend/app/components/workflow/WorkflowCanvas.tsx`

**Display:**
```tsx
<span>{nodes.length} node{nodes.length !== 1 ? "s" : ""}</span>
<span>{edges.length} edge{edges.length !== 1 ? "s" : ""}</span>
```

Separated from workflow name by `borderLeft` + `pl-4`. Font: medium weight, gray-700.

---

## Caveats

- No breakdown by node type (would require counting each type)
- Count is not clickable (no filtering)