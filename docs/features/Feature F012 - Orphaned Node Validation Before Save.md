# Feature F012 — Orphaned Node Validation Before Save

**Status:** Pending (not implemented)

---

## Requirements

- **FR1:** When saving a workflow, warn if any nodes have no incoming or outgoing edges
- **FR2:** List the orphaned nodes by type and ID
- **FR3:** User can cancel save or confirm anyway
- **NFR1:** No breaking changes to existing functionality

---

## Planning

**Problem:** Saved workflows with orphaned nodes are confusing when re-loaded — nodes appear floating with no context.

**Solution:** Before `POST /api/workflows`, filter nodes where `edges.every(e => e.source !== n.id && e.target !== n.id)`. If any exist, show `confirm()` dialog.

---

## Implementation

**Files changed:**
- `frontend/app/components/workflow/WorkflowCanvas.tsx`

**Logic:**
```typescript
const orphaned = nodes.filter(n =>
  edges.every(e => e.source !== n.id && e.target !== n.id)
);
if (orphaned.length > 0) {
  const names = orphaned.map(n => `${n.type} (${n.id})`).join(", ");
  if (!confirm(`Warning: ${orphaned.length} orphaned node(s) have no connections: ${names}. Save anyway?`)) return;
}
```

---

## Acceptance Criteria

- [ ] **FR1:** When saving a workflow, warn if any nodes have no incoming or outgoing edges
- [ ] **FR2:** List the orphaned nodes by type and ID
- [ ] **FR3:** User can cancel save or confirm anyway
- [ ] **NFR1:** No breaking changes to existing functionality

---

## Test Cases

- Verify feature works per requirements
- Run `cd backend && source venv/bin/activate && python -m pytest tests/ -q`
- Run `cd frontend && npx -p typescript tsc --noEmit`

---

## Caveats

- A node with only incoming OR only outgoing edges is not orphaned — it might be a valid source-only or sink-only node
- The check uses node `id` which is ReactFlow-generated (e.g., "in1", "llm1") — user-friendly names would be better

---

## Files Modified

- `frontend/app/components/workflow/WorkflowCanvas.tsx`
