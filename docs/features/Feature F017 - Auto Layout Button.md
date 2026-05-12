# Feature F017 — Auto-Layout Button

**Status:** Pending (not implemented)

---

## Requirements

- **FR1:** Button arranges all nodes in a left-to-right DAG layout
- **FR2:** Uses dagre graph layout library
- **FR3:** Automatically fits the view after layout is applied
- **NFR1:** No breaking changes to existing functionality

---

## Planning

**Problem:** Nodes are placed at drop position and can overlap or be poorly arranged — manual dragging to arrange is tedious.

**Solution:** `dagre` npm package calculates optimal positions using a left-to-right hierarchical layout.

---

## Implementation

**Files changed:**
- `frontend/app/components/workflow/WorkflowCanvas.tsx`
- `frontend/package.json` — added `dagre`, `@types/dagre`

**Algorithm:**
1. Create dagre graph, `rankdir: "LR"`, `nodesep: 80`, `ranksep: 120`
2. Add all nodes/edges
3. `dagre.layout(g)`
4. Map `{ id: node.id, position: { x: g.node(id).x, y: g.node(id).y } }` for each node
5. `setNodes(nodes.map(n => ({ ...n, position: newPositions[n.id] })))`
6. `setTimeout(() => reactFlow.fitView({ padding: 0.2 }), 50)`

**Button:** LayoutDashboard icon, positioned between Redo and Load. LayoutDashboard icon. Label shown as title tooltip.

---

## Acceptance Criteria

- [ ] **FR1:** Button arranges all nodes in a left-to-right DAG layout
- [ ] **FR2:** Uses dagre graph layout library
- [ ] **FR3:** Automatically fits the view after layout is applied
- [ ] **NFR1:** No breaking changes to existing functionality

---

## Test Cases

- Verify feature works per requirements
- Run `cd backend && source venv/bin/activate && python -m pytest tests/ -q`
- Run `cd frontend && npx -p typescript tsc --noEmit`

---

## Caveats

- Nodes with the same rank may have overlapping positions — `nodesep` helps but doesn't guarantee no overlap
- Auto-layout resets all manual positioning — user may want to preserve some manual placement
- Running auto-layout on a very large graph (50+ nodes) may be slow

---

## Files Modified

- `frontend/app/components/workflow/WorkflowCanvas.tsx`
- `frontend/package.json` — added `dagre`, `@types/dagre`
