# Feature F029 — Rule Node Branching Fix & UI Defaults

**Status:** Done
**Version:** v0.6.2
**Date:** May 11, 2026

---

## 1. Requirements

Rule node branching (`true`/`false` paths) was silently broken. When executing a workflow, the frontend stripped `sourceHandle` from edges, so the backend could never determine which downstream node to follow after a rule node. Additionally, two minor UX issues needed fixing: workflows loaded at a zoomed-in level, and the node library panel started expanded by default.

## 2. Planning

- **Root cause:** `runWorkflow` in `WorkflowCanvas.tsx` mapped edges to `{ id, source, target }` only — omitting `sourceHandle`.
- **Backend was ready:** `Edge` model in `main.py` already had `sourceHandle: Optional[str] = None`, and `execute_node_recursive` used it for rule branching.
- **Zoom issue:** `fitView()` was called after loading a workflow, overriding the user's zoom level.
- **Node library:** `useState(true)` defaulted to expanded.

## 3. Implementation

### Frontend — `WorkflowCanvas.tsx`

1. Added `sourceHandle` to the edge mapping in `runWorkflow`:
   ```js
   edges: edges.map((edge) => ({
     id: edge.id,
     source: edge.source,
     target: edge.target,
     sourceHandle: edge.sourceHandle || undefined,
   })),
   ```
2. Removed `fitView()` call after loading a saved workflow.
3. Changed `nodeLibraryExpanded` default from `true` to `false`.

### Backend — No changes needed

The backend already supported `sourceHandle` in its `Edge` model and used it in `execute_node_recursive` for rule branching.

### Tests — `test_workflow.py`

Added `test_rule_node_edges_with_source_handle` to verify that edges with `sourceHandle="true"` and `sourceHandle="false"` are correctly stored in `incoming_edges` by `parse_workflow_graph`.

## 4. Testing

- **Backend:** 89 tests passing (1 new test for sourceHandle branching).
- **Frontend:** 0 TypeScript compilation errors.
- **Manual:** Rule node workflows now correctly follow `true`/`false` paths to downstream nodes.

## 5. Caveats

- If a user connects edges from a rule node without using the labeled handles (e.g., dragging from the node body instead of a specific handle), `sourceHandle` will be `undefined` and the backend will treat the edge as an unconditional connection (no branching filter applied).

## 6. Related Features

- F028 — Save Validation & Workflow Browser (where the original edge mapping was introduced)
- F004 — Rule Node (original branching feature)

## 7. References

- `frontend/app/components/workflow/WorkflowCanvas.tsx` — edge mapping and fitView
- `backend/main.py` — Edge model with `sourceHandle`, `execute_node_recursive`
- `backend/tests/test_workflow.py` — `test_rule_node_edges_with_source_handle`
