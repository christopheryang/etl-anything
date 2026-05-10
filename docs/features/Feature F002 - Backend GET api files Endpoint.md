# Feature F002 — Backend GET /api/files Endpoint

**Status:** Done (backend only)


> **Note:** This is a backend-only feature. No UI component required.**Feature ID:** F002

---

## Requirements

- List all uploaded files in `UPLOADS_DIR`
- Return file metadata: id, name, size, uploaded_at
- Endpoint: `GET /api/files`

---

## Planning

**Problem:** Frontend needs to know what files are available for Input nodes to reference.

**Solution:** Iterate `backend/uploads/`, return file metadata for each entry.

---

## Implementation Summary

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

## Caveats

- Files are identified by their original filename (not UUID). This could cause collisions if two files with the same name are uploaded.
- No pagination — returns all files at once (acceptable for workshop use)