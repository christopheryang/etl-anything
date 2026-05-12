# API Reference

All endpoints are relative to the base URL (default: `http://localhost:8000`).

---

## Health

### `GET /`

Health check.

**Response:**
```json
{
  "service": "ETL Anything API",
  "status": "running",
  "version": "1.0.0"
}
```

---

## Workflows

### `GET /api/workflows`

List saved workflows with pagination and sorting.

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number (1-indexed) |
| `page_size` | int | 10 | Items per page |
| `sort_by` | string | `updated_at` | Sort field: `name`, `created_at`, `updated_at` |
| `sort_order` | string | `desc` | Sort direction: `asc` or `desc` |

**Response:** `200 OK`
```json
{
  "workflows": [
    {
      "id": "abc-123",
      "name": "Document Summarizer",
      "description": "Summarizes PDFs using Claude",
      "node_count": 3,
      "created_at": "2026-05-09T00:00:00Z",
      "updated_at": "2026-05-09T01:00:00Z"
    }
  ],
  "total_count": 42
}
```

---

### `POST /api/workflows`

Save a workflow.

**Request body:**
```json
{
  "name": "My Workflow",
  "description": "Optional description",
  "workflow": {
    "nodes": [
      {
        "id": "node_1",
        "type": "input",
        "position": {"x": 100, "y": 200},
        "data": { "fileId": "file_abc", "fileName": "document.pdf" }
      }
    ],
    "edges": [
      {
        "id": "edge_1",
        "source": "node_1",
        "target": "node_2",
        "sourceHandle": null
      }
    ]
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "abc-123",
  "name": "My Workflow",
  "created_at": "2026-05-09T00:00:00Z"
}
```

---

### `GET /api/workflows/{workflow_id}`

Get a specific workflow by ID.

**Response:** `200 OK`
```json
{
  "id": "abc-123",
  "name": "My Workflow",
  "description": "...",
  "workflow": {
    "nodes": [...],
    "edges": [...]
  },
  "created_at": "2026-05-09T00:00:00Z",
  "updated_at": "2026-05-09T00:00:00Z"
}
```

**Error:** `404 Not Found` if workflow doesn't exist.

---

### `PUT /api/workflows/{workflow_id}`

Update an existing workflow.

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "workflow": {
    "nodes": [...],
    "edges": [...]
  }
}
```

**Response:** `200 OK`
```json
{
  "workflowId": "abc-123",
  "name": "Updated Name",
  "message": "Workflow updated successfully"
}
```

**Error:** `404 Not Found` if workflow doesn't exist.

---

### `DELETE /api/workflows/{workflow_id}`

Delete a workflow.

**Response:** `200 OK`
```json
{
  "message": "Workflow deleted"
}
```

**Error:** `404 Not Found` if workflow doesn't exist.

---

## Executions

### `POST /api/executions`

Start a workflow execution.

**Request body:**
```json
{
  "workflow": {
    "nodes": [
      {
        "id": "in1",
        "type": "input",
        "position": {"x": 0, "y": 0},
        "data": { "fileId": "file_abc", "fileName": "doc.pdf" }
      },
      {
        "id": "llm1",
        "type": "llm",
        "position": {"x": 200, "y": 0},
        "data": {
          "prompt": "Summarize: {{input}}",
          "model": "claude-haiku-4-5",
          "temperature": 0.7
        }
      },
      {
        "id": "out1",
        "type": "output",
        "position": {"x": 400, "y": 0},
        "data": { "fileName": "summary", "format": "json" }
      }
    ],
    "edges": [
      { "id": "e1", "source": "in1", "target": "llm1" },
      { "id": "e2", "source": "llm1", "target": "out1" }
    ]
  }
}
```

**Response:** `201 Created`
```json
{
  "execution_id": "exec_xyz_789"
}
```

Frontend should then poll `GET /api/executions/{execution_id}` every 2 seconds.

---

### `GET /api/executions/{execution_id}`

Get execution status and results.

**Response:** `200 OK`
```json
{
  "execution_id": "exec_xyz_789",
  "status": "completed",
  "started_at": "2026-05-09T00:00:00Z",
  "completed_at": "2026-05-09T00:01:30Z",
  "progress": 100,
  "node_results": {
    "in1": "Document text here...",
    "llm1": "Claude's response...",
    "out1": "/path/to/output/file.json"
  }
}
```

**Status values:** `pending` | `running` | `completed` | `failed` | `cancelled`

---

### `DELETE /api/executions/{execution_id}`

Cancel a running execution.

**Response:** `200 OK`
```json
{
  "execution_id": "exec_xyz_789",
  "status": "cancelled"
}
```

**Behavior:**
- Sets status to `cancelled`
- Stops scheduling new node executions
- Already-completed nodes are not rolled back
- Subsequent polls return `status: "cancelled"`

---

### `GET /api/executions/{execution_id}/download`

Download the output file from an Output node.

**Response:** `200 OK` — File download (Content-Disposition header set)

The output file is at `outputs/{execution_id}.{format}` on the server.

**Error:** `404 Not Found` if execution not found or no output file exists.

---

## Files

### `GET /api/files`

List all uploaded files.

**Response:** `200 OK`
```json
{
  "files": [
    {
      "id": "file_abc",
      "name": "document.pdf",
      "size": 2048576,
      "uploaded_at": "2026-05-09T00:00:00Z"
    }
  ]
}
```

---

### `POST /api/files`

Upload a file.

**Request:** `multipart/form-data`
- Field name: `file`
- Accepts: `.pdf`, `.txt`, `.md`, `.csv`, `.json`

**Response:** `201 Created`
```json
{
  "fileId": "file_abc",
  "fileName": "document.pdf",
  "size": 2048576
}
```

---

### `GET /api/files/{filename}`

Download a previously uploaded file.

**Response:** `200 OK` — File download

**Error:** `404 Not Found` if file doesn't exist.

---

## Node Data Schemas

### InputNodeData
```json
{
  "fileId": "file_abc",
  "fileName": "document.pdf"
}
```

### LLMNodeData
```json
{
  "prompt": "Summarize: {{input}}",
  "model": "claude-haiku-4-5",
  "temperature": 0.7
}
```

**Available models:**
- `claude-haiku-4-5` (fast, cheap)
- `claude-sonnet-4-7` (medium)
- `claude-opus-4-7` (slow, expensive)

### OutputNodeData
```json
{
  "fileName": "summary",
  "format": "json"
}
```

**Formats:** `json` | `txt` | `csv`

### RuleNodeData
```json
{
  "logic": "AND",
  "conditions": [
    {
      "variable": "status",
      "operator": "==",
      "value": "active"
    },
    {
      "variable": "score",
      "operator": ">=",
      "value": 50
    }
  ]
}
```

**Logic values:** `AND` | `OR`

**Operators:**
- `==` — equals (numeric-aware: "50" == 50)
- `!=` — not equals
- `>` — greater than (numeric only)
- `<` — less than (numeric only)
- `>=` — greater or equal (numeric only)
- `<=` — less or equal (numeric only)
- `is` — equals (case-insensitive string)
- `is not` — not equals (case-insensitive string)
- `in` — value in list or substring in string
- `not in` — value not in list or substring not in string

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "detail": "Error message here"
}
```

**Common HTTP status codes:**
- `200` — Success
- `201` — Created
- `400` — Bad request (invalid JSON, missing fields)
- `404` — Not found
- `422` — Validation error (Pydantic validation failed)
- `500` — Internal server error