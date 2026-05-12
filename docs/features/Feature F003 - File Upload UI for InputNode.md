# Feature F003 — File Upload UI for InputNode

**Date Created:** 2026-05-10
**Status:** Done
**Author:** AI Agent
**Version:** v0.1

---

## Requirements

### User Stories

1. **As a user**, I want to upload files directly from the InputNode so that I can provide input data to my workflow without touching the backend.
2. **As a user**, I want to see the upload status and filename so that I know the file was successfully attached to the node.

### Functional Requirements

- **FR1:** InputNode has a file upload button
- **FR2:** Upload POSTs to `/api/files` and stores the returned `fileId` in node data
- **FR3:** Shows filename and upload status in the node body
- **FR4:** Accepted types: .pdf, .txt, .md, .csv, .json

### Non-Functional Requirements

- **NFR1:** Upload must use standard `FormData` for browser compatibility
- **NFR2:** Node must display clear visual feedback during and after upload
- **NFR3:** Only accepted file types should be selectable in the file picker

---

## Planning

**Problem:** No way to get files into the system from the UI — only backend-side file drops were supported.

**Solution:** Add hidden `<input type="file">` in InputNode, trigger on button click, POST on selection, store `fileId` and `fileName` in node `data`.

---

## Implementation Details

**Files changed:**
- `frontend/app/components/workflow/nodes/InputNode.tsx`

**UI flow:**
1. Upload button click → triggers hidden file input
2. User selects file
3. `POST /api/files` with `FormData` (field name: `"file"`)
4. Response `{ fileId, fileName }` stored in `data.fileId` and `data.fileName`
5. Node body shows filename + "uploaded" status

---

## Acceptance Criteria

- [x] InputNode displays a file upload button
- [x] Clicking the button opens a file picker filtered to accepted types (.pdf, .txt, .md, .csv, .json)
- [x] Selected file is POSTed to `/api/files` and `fileId` is stored in node data
- [x] Node body shows filename and upload status after successful upload
- [ ] Upload progress indicator is shown during upload

---

## Test Cases

### Test 1: Upload a Supported File
**Steps:** Click upload button in InputNode, select a `.pdf` file.
**Expected:** File is POSTed to `/api/files`, response `fileId` and `fileName` stored in node data, node displays filename with "uploaded" status.

### Test 2: Upload Different File Types
**Steps:** Upload each accepted type (.pdf, .txt, .md, .csv, .json) one at a time.
**Expected:** Each file type is accepted and uploaded successfully.

### Test 3: File Type Filtering
**Steps:** Click upload button and inspect the file picker.
**Expected:** Only .pdf, .txt, .md, .csv, .json files are selectable in the file picker.

---

## Caveats/TODOs

- `isUploading` state is local to the node component — re-render on canvas won't persist the "uploading" visual
- No upload progress indicator (basic browser FormData upload)
- No way to remove/replace a file once uploaded (must reload workflow)

---

## Files Modified

- `frontend/app/components/workflow/nodes/InputNode.tsx` — Added file upload button, hidden file input, POST to `/api/files`, filename/status display
