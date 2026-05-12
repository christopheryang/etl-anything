# Feature F028 — Save Validation & Workflow Browser

**Status:** Done

---

## Requirements

- **FR1:** Reject saving workflows with the default name "Untitled Workflow" — user must provide a custom name
- **FR2:** Save modal with name (required) and description (optional) fields
- **FR3:** Fix save request shape to match backend: `{ name, description, workflow: { nodes, edges } }`
- **FR4:** Folder icon in left sidebar rail to open saved workflows
- **FR5:** Workflow browser modal showing list of saved workflows: name, description, created_at, updated_at, node_count
- **FR6:** Sortable columns — click column heading to toggle asc/desc sort
- **FR7:** Paginated list (10 per page) with page navigation controls
- **FR8:** Single click on a workflow row opens (loads) that workflow into the canvas
- **NFR1:** Backend list endpoint supports `page`, `page_size`, `sort_by`, `sort_order` query params

## Planning

1. Add `SaveWorkflowModal` component with name validation
2. Add `WorkflowBrowser` component with table, sorting, pagination
3. Update `LeftSidebar` with FolderOpen icon button
4. Fix `saveWorkflow` request shape in `WorkflowCanvas`
5. Add `loadWorkflow` function in `WorkflowCanvas`
6. Extend backend `GET /api/workflows` with pagination + sorting
7. Update Next.js proxy to pass query params through
8. Add backend tests for pagination and sorting

## Implementation

- **SaveWorkflowModal:** Modal dialog with name input (required, rejects "Untitled Workflow"), description textarea, Save/Cancel buttons, Enter-key support, auto-focus on open
- **WorkflowBrowser:** Full-screen modal with table, sortable column headers (ArrowUp/ArrowDown icons), pagination controls (ChevronLeft/ChevronRight), click-to-load on row click
- **Backend pagination:** `list_workflows()` accepts `page`, `page_size`, `sort_by`, `sort_order`; returns `{ workflows, total_count }`
- **LeftSidebar:** Added `onOpen` prop and FolderOpen icon button between Save and Run

## Acceptance Criteria

- Clicking Save with "Untitled Workflow" as name opens modal with empty name field and validation error
- Entering a custom name and clicking Save persists the workflow
- Backend rejects the old flat `{ name, nodes, edges }` shape; requires `{ name, workflow: { nodes, edges } }`
- Clicking folder icon opens workflow browser
- Clicking a column heading sorts the table; clicking again reverses order
- Pagination shows correct page count and navigation
- Clicking a workflow row loads it into the canvas and closes the browser

## Test Cases

- `test_list_workflows_pagination`: Verify page_size=1 returns 1 workflow, sort_by=name&sort_order=asc returns sorted names
- `test_list_workflows`: Updated to assert `total_count` field exists
- Manual: Save with blank name → error shown; Save with valid name → success; Open browser → list shown; Sort by clicking headers; Navigate pages; Click row → loads

## Caveats

- Workflow list is loaded from disk on each request (no caching) — acceptable for current scale
- Pagination is in-memory (all metadata loaded then sliced) — fine for <1000 workflows
- Deleting workflows from the browser is not yet supported (future enhancement)

## Files Modified

- `frontend/app/components/workflow/SaveWorkflowModal.tsx` (new)
- `frontend/app/components/workflow/WorkflowBrowser.tsx` (new)
- `frontend/app/components/workflow/LeftSidebar.tsx`
- `frontend/app/components/workflow/WorkflowCanvas.tsx`
- `frontend/app/api/workflows/route.ts`
- `backend/main.py`
- `backend/tests/test_api.py`
