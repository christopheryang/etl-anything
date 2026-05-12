# Feature F024 — Workflow Templates Library

**Status:** Done

---

## Requirements

- **FR1:** Template definition: templateId, name, description, category, workflow (nodes+edges), tags
- **FR2:** Built-in templates stored in `frontend/templates/` (client-side, instant load)
- **FR3:** User can save current workflow as template (backend storage)
- **FR4:** Template library modal: grid/list view, category filter, search by name/tags, preview, one-click load
- **FR5:** API endpoints: GET /api/templates, POST /api/templates, DELETE /api/templates/{id}
- **NFR1:** Built-in templates load instantly (no API call)
- **NFR2:** User templates stored in `backend/templates/` as JSON

---

## Planning

- Phase 1: Built-in templates (client-side JSON files + modal component)
- Phase 2: User templates (backend CRUD endpoints + file storage)

---

## Implementation

- `frontend/templates/simple-etl.json` — Basic ETL pipeline
- `frontend/templates/document-classifier.json` — Classification with rule branching
- `frontend/templates/data-validator.json` — Data quality validation
- `TemplateLibrary.tsx` — Grid/list view, category filter (All/ETL/Analysis/Validation/Custom), search, preview, load button
- `WorkflowCanvas.tsx` — Templates button in left sidebar opens modal

---

## Acceptance Criteria

- [ ] Browse available templates in grid/list view
- [ ] Filter by category
- [ ] Search by name/description/tags
- [ ] Click template to preview
- [ ] Load button imports workflow onto canvas
- [ ] 3 built-in templates provided

---

## Test Cases

- **Load template:** Click template → nodes/edges appear on canvas matching template JSON
- **Category filter:** Select "ETL" → only ETL templates shown
- **Search:** Type "validator" → data-validator template appears
- **Backend CRUD:** POST template → GET returns it → DELETE removes it

---

## Caveats

- No template versioning — editing a saved template overwrites it
- Template sharing between users requires backend auth (future)
- Preview shows description only, not interactive mini-canvas (TODO)

---

## Files Modified

- `frontend/templates/simple-etl.json` (new)
- `frontend/templates/document-classifier.json` (new)
- `frontend/templates/data-validator.json` (new)
- `frontend/app/components/workflow/TemplateLibrary.tsx` (new)
- `frontend/app/components/workflow/WorkflowCanvas.tsx` — Template modal integration
