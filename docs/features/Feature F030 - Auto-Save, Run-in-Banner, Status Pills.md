# Feature F030 — Auto-Save, Run-in-Banner, Status Pills

**Status:** Done  
**Version:** v0.6.3  
**Date:** May 11, 2026

---

## Summary

Three quality-of-life improvements: auto-save for existing workflows, moving the Run button to the banner bar, and colored status pills in the execution history panel.

---

## Requirements

1. Workflows that have been saved should auto-save changes after a short debounce period
2. Users need a visual indicator of unsaved changes
3. The Run button should be prominently placed in the workflow name bar, not buried in the left sidebar
4. Execution history should show colored status badges instead of just text

---

## Implementation

### Auto-Save

- **New state:** `workflowId` (string | null), `hasUnsavedChanges` (boolean), `autoSaveTimerRef`
- **Trigger:** `useEffect` watches `nodes`, `edges`, `workflowName`, `workflowId` — sets `hasUnsavedChanges = true` on any change, then debounces a PUT to `/api/workflows/{workflowId}` after 3 seconds
- **Quick-save button:** Appears in banner when `workflowId` is set; grayed out when `!hasUnsavedChanges`
- **Save modal flow:** `saveWorkflow()` now does PUT when `workflowId` exists, POST otherwise; captures `workflowId` from response; clears `hasUnsavedChanges` on success
- **Load workflow:** Sets `workflowId` and clears `hasUnsavedChanges`
- **Template load:** Resets `workflowId` to null

### Run-in-Banner

- **Run button:** Teal button with Play icon added to the workflow name bar (next to the name input)
- **LeftSidebar:** Removed `onRun` prop and Play/Run ActionButton — Run is now only in the banner
- **Save button:** Quick-save (Save icon) appears next to Run when workflow has been saved

### Status Pills

- **Execution list:** Each item now shows a colored pill badge next to the workflow name:
  - Green: completed
  - Red: failed
  - Yellow: cancelled
  - Gray: other (pending/running)
- **Detail panel:** Same colored pill badge replaces the plain-text status span

### Backend Changes

- **PUT /api/workflows/{workflow_id}:** New endpoint — updates name, description, workflow definition; returns `WorkflowMetadata`
- **execute_workflow_engine:** Now accepts `workflow_name` and `workflow_id` params, passes them to `save_execution_history`
- **Execute endpoint:** Passes `request.workflowName` and `request.workflowId` to `background_tasks.add_task`

### Frontend Proxy

- **PUT handler** added to `/app/api/workflows/[id]/route.ts` — proxies PUT requests to backend

---

## Files Changed

| File | Change |
|------|--------|
| `backend/main.py` | Added PUT endpoint, updated `execute_workflow_engine` signature, fixed indentation |
| `frontend/app/api/workflows/[id]/route.ts` | Added PUT handler |
| `frontend/app/components/workflow/WorkflowCanvas.tsx` | Added `workflowId`, `hasUnsavedChanges`, auto-save effect, Run/Save buttons in banner, updated `saveWorkflow`/`loadWorkflow`/`loadTemplate` |
| `frontend/app/components/workflow/LeftSidebar.tsx` | Removed `onRun` prop and Run ActionButton |
| `frontend/app/components/workflow/ExecutionHistoryPanel.tsx` | Added status pill badges to list and detail views |

---

## Caveats

- Auto-save only fires for workflows that have been saved (have a `workflowId`). New/unsaved workflows still require manual Save.
- Auto-save silently fails (no user notification) to avoid disrupting workflow editing.
- The `hasUnsavedChanges` flag triggers on any node/edge change, including position moves. Closing the browser with unsaved changes will lose them if auto-save hasn't fired yet.
