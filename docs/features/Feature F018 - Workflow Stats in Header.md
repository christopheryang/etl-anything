# Feature F018 — Workflow Stats in Header

**Status:** Pending (not implemented)

---

## Requirements

- **FR1:** Live node count and edge count displayed in the header bar
- **FR2:** Updates as nodes are added/removed/connected
- **NFR1:** No breaking changes to existing functionality

---

## Planning

**Problem:** User has no at-a-glance view of workflow size — must manually count nodes/edges.

**Solution:** Inline `{nodes.length}` and `{edges.length}` JSX in the header, using plural singular form.

---

## Implementation

**Files changed:**
- `frontend/app/components/workflow/WorkflowCanvas.tsx`

**Display:**
```tsx
<span>{nodes.length} node{nodes.length !== 1 ? "s" : ""}</span>
<span>{edges.length} edge{edges.length !== 1 ? "s" : ""}</span>
```

Separated from workflow name by `borderLeft` + `pl-4`. Font: medium weight, gray-700.

---

## Acceptance Criteria

- [ ] **FR1:** Live node count and edge count displayed in the header bar
- [ ] **FR2:** Updates as nodes are added/removed/connected
- [ ] **NFR1:** No breaking changes to existing functionality

---

## Test Cases

- Verify feature works per requirements
- Run `cd backend && source venv/bin/activate && python -m pytest tests/ -q`
- Run `cd frontend && npx -p typescript tsc --noEmit`

---

## Caveats

- No breakdown by node type (would require counting each type)
- Count is not clickable (no filtering)

---

## Files Modified

- `frontend/app/components/workflow/WorkflowCanvas.tsx`
