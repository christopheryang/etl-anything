# Feature F002 — Backend GET /api/files Endpoint

**Date Created:** 2026-05-10
**Status:** Done
**Author:** AI Agent
**Version:** v0.1

---

## Requirements

### User Stories

1. **As a user**, I want to see a list of all uploaded files so that I can select them for Input nodes in my workflow.

### Functional Requirements

- **FR1:** List all uploaded files in `UPLOADS_DIR`
- **FR2:** Return file metadata: id, name, size, uploaded_at
- **FR3:** Endpoint: `GET /api/files`

### Non-Functional Requirements

- **NFR1:** Response must include sufficient metadata for the frontend to display file listings
- **NFR2:** No pagination required (acceptable for workshop-scale usage)
- **NFR3:** Endpoint must handle empty upload directory gracefully

---

## Planning

**Problem:** Frontend needs to know what files are available for Input nodes to reference.

**Solution:** Iterate `backend/uploads/`, return file metadata for each entry.

---

## Implementation Details

**Files changed:**
- `backend/main.py`

**Endpoint:** `GET /api/files`

**Response:**
```json
{
  "files": [
    { "id": "file_abc", "name": "document.pdf", "size": 2048576, "uploaded_at": "..." }
  ]
}
```

**Implementation:** `os.listdir(UPLOADS_DIR)` → stat each file → return metadata array.

---

## Acceptance Criteria

- [x] `GET /api/files` returns a JSON array of file metadata
- [x] Each file entry includes id, name, size, and uploaded_at
- [x] Endpoint lists all files in `UPLOADS_DIR`
- [x] Empty upload directory returns `{ "files": [] }`

---

## Test Cases

### Test 1: List Files with Uploads Present
**Steps:** Upload multiple files to `UPLOADS_DIR`, call `GET /api/files`.
**Expected:** Response contains all uploaded files with correct metadata (id, name, size, uploaded_at).

### Test 2: List Files with Empty Directory
**Steps:** Ensure `UPLOADS_DIR` is empty, call `GET /api/files`.
**Expected:** Response is `{ "files": [] }`.

---

## Caveats/TODOs

- Files are identified by their original filename (not UUID). This could cause collisions if two files with the same name are uploaded.
- No pagination — returns all files at once (acceptable for workshop use)

---

## Files Modified

- `backend/main.py` — Added `GET /api/files` endpoint with file listing and metadata
