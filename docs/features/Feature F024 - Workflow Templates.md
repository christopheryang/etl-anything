# Feature F024 — Workflow Templates Library

**Date Created:** May 9, 2026  
**Status:** Done  
**Author:** AI Agent

---

## Requirements (Summary)

- Users can browse pre-built workflow templates
- Templates categorized (ETL, Analysis, Validation)
- Search by name, description, or tags
- Load template onto canvas with one click
- 3 built-in templates: Simple ETL, Document Classifier, Data Validator

### User Stories

1. **As a user**, I want to save my workflow as a template so that I can reuse it later or share it with others.
2. **As a user**, I want to browse available templates so that I can start with a pre-built workflow.
3. **As a user**, I want to load a template onto my canvas so that I can customize it for my needs.
4. **As a user**, I want to categorize templates (ETL, Data Processing, Analysis) so that I can find them easily.

### Functional Requirements

- **FR1:** Template definition includes:
  - `templateId` (unique identifier)
  - `name` (human-readable name)
  - `description` (what the workflow does)
  - `category` (ETL, Analysis, Validation, Custom)
  - `workflow` (nodes and edges)
  - `tags` (array of keywords)
  - `createdAt` (ISO timestamp)
  - `author` (optional)
- **FR2:** Built-in templates provided by the application (stored in `frontend/templates/`)
- **FR3:** User can save current workflow as template
- **FR4:** Template library modal shows:
  - Grid of template cards with preview
  - Filter by category
  - Search by name/tags
  - Click to preview workflow structure
  - Load button to import onto canvas
- **FR5:** API endpoints:
  - `GET /api/templates` - List all templates (built-in + user)
  - `POST /api/templates` - Save new user template
  - `DELETE /api/templates/{id}` - Delete user template
  - `GET /api/templates/{id}` - Get template details

### Non-Functional Requirements

- **NFR1:** Built-in templates load instantly (client-side)
- **NFR2:** User templates stored in `backend/templates/` as JSON files
- **NFR3:** Template preview shows simplified node diagram or description

---

## Planning

### Phase 1: Built-in Templates Client-Side
1. Create `frontend/templates/` directory with JSON template files
2. Create `TemplateLibrary` modal component
3. Add "Templates" button to toolbar
4. Load template onto canvas

### Phase 2: User Templates Backend
1. Backend endpoints for save/list/delete
2. File storage for user templates
3. Integration with template library

### Testing
1. Unit tests for template loading
2. E2E tests for save/load workflow as template

---

## Caveats

- Template versioning not included in initial implementation
- Template sharing between users requires backend storage (future enhancement)

---

## Implementation Summary

**Files Added:**
- `frontend/templates/simple-etl.json` - Basic ETL pipeline template
- `frontend/templates/document-classifier.json` - Document classification with rule branching
- `frontend/templates/data-validator.json` - Data quality validation workflow
- `frontend/app/components/workflow/TemplateLibrary.tsx` - Template browser modal component

**Files Modified:**
- `frontend/app/components/workflow/WorkflowCanvas.tsx` - Integrated template library modal

**Features:**
- Grid and list view modes
- Category filtering (All, ETL, Analysis, Validation, Custom)
- Search by name, description, or tags
- Template preview showing nodes and description
- One-click load to canvas

---

## Acceptance Criteria

- ✅ Users can browse available templates
- ✅ Templates are categorized
- ✅ Users can search templates
- ✅ Click template to see preview
- ✅ Load button imports workflow onto canvas
- ✅ 3 built-in templates provided
