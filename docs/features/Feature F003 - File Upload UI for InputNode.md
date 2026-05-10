# Feature F003 — File Upload UI for InputNode

**Status:** Done
**Feature ID:** F003

---

## Requirements

- InputNode has a file upload button
- Upload POSTs to `/api/files` and stores the returned `fileId` in node data
- Shows filename and upload status in the node body
- Accepted types: .pdf, .txt, .md, .csv, .json

---

## Planning

**Problem:** No way to get files into the system from the UI — only backend-side file drops were supported.

**Solution:** Add hidden `<input type="file">` in InputNode, trigger on button click, POST on selection, store `fileId` and `fileName` in node `data`.

---

## Implementation Summary

**Files changed:**
- `frontend/app/components/workflow/nodes/InputNode.tsx`

**UI flow:**
1. Upload button click → triggers hidden file input
2. User selects file
3. `POST /api/files` with `FormData` (field name: `"file"`)
4. Response `{ fileId, fileName }` stored in `data.fileId` and `data.fileName`
5. Node body shows filename + "uploaded" status

---

## Caveats

- `isUploading` state is local to the node component — re-render on canvas won't persist the "uploading" visual
- No upload progress indicator (basic browser FormData upload)
- No way to remove/replace a file once uploaded (must reload workflow)