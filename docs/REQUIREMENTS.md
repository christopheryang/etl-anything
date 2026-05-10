# Requirements — ETL Anything

Complete, consolidated requirements for all features in the ETL Anything project. Each requirement set links to its detailed feature document.

**Last updated:** May 9, 2026  
**Audit status:** All 21 features audited and documented

## Feature Status Summary

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| F001 | Workflow Import/Export | ⚠️ Partial | Export via Save button; Import not implemented |
| F002 | Backend GET /api/files | ✅ Done | Backend API endpoint |
| F003 | File Upload UI | ✅ Done | InputNode file upload |
| F004 | Execution Cancellation | ❌ Pending | No Cancel button |
| F005 | Load Workflow Modal | ❌ Pending | No Load button |
| F006 | Model Mapping | ✅ Done | Backend supports 3 models |
| F007 | System Prompt | ✅ Done | Backend parameter |
| F008 | Dark Mode Toggle | ✅ Done | Settings menu |
| F009 | Execution Logs Panel | ❌ Pending | Not implemented |
| F010 | Keyboard Shortcuts | ❌ Pending | Not implemented |
| F011 | Node Tooltip | ❌ Pending | Not implemented |
| F012 | Orphaned Node Validation | ❌ Pending | Not implemented |
| F013 | Undo/Redo | ❌ Pending | Not implemented |
| F014 | New Workflow Button | ❌ Pending | Not implemented |
| F015 | Delete with Keyboard | ❌ Pending | Not implemented |
| F016 | MiniMap Toggle | ✅ Done | Settings menu |
| F017 | Auto-Layout | ❌ Pending | Not implemented |
| F018 | Workflow Stats | ❌ Pending | Not implemented |
| F019 | Pre-Run Validation | ⚠️ Partial | Basic validation exists |
| F020 | Help Modal | ❌ Pending | Not implemented |
| F021 | Toast Notifications | ❌ Pending | Not implemented |

**Implemented (UI):** F003, F008, F016  
**Implemented (Backend):** F002, F006, F007  
**Partial:** F001, F019  
**Pending:** F004, F005, F009, F010, F011, F012, F013, F014, F015, F017, F018, F020, F021

---

## Implemented Features (UI)

### F003 — File Upload UI for InputNode
[Feature F003](./features/Feature%20F003%20-%20File%20Upload%20UI%20for%20InputNode.md) | **Status: Done**

- InputNode has a file upload button
- Upload POSTs to `/api/files` and stores the returned `fileId` in node data
- Shows filename and upload status in the node body
- Accepted types: .pdf, .txt, .md, .csv, .json

### F008 — Dark Mode / Theme Toggle
[Feature F008](./features/Feature%20F008%20-%20Dark%20Mode%20Theme%20Toggle.md) | **Status: Done**

- Settings menu (hamburger icon) has Theme toggle
- Toggles between Light and Dark modes
- Uses `next-themes` package with `useTheme()` hook
- Icon changes: Moon in light mode, Sun in dark mode

### F016 — MiniMap Toggle Button
[Feature F016](./features/Feature%20F016%20-%20MiniMap%20Toggle%20Button.md) | **Status: Done**

- Toggle button in Settings menu shows/hides the ReactFlow MiniMap panel
- State persists during session (not saved to storage)

---

## Implemented Features (Backend Only)

### F002 — Backend GET /api/files Endpoint
[Feature F002](./features/Feature%20F002%20-%20Backend%20GET%20api%20files%20Endpoint.md) | **Status: Done**

- List all uploaded files in `UPLOADS_DIR`
- Return file metadata: id, name, size, uploaded_at
- Endpoint: `GET /api/files`

### F006 — Model Mapping Expansion (Sonnet 4.7, Opus 4.7)
[Feature F006](./features/Feature%20F006%20-%20Model%20Mapping%20Expansion.md) | **Status: Done**

- ReasoningNode dropdown includes three Claude models: Haiku 4.5, Sonnet 4.7, Opus 4.7
- TypeScript type updated to cover all three models
- Backend fallback chains already existed for Sonnet and Opus

### F007 — System Prompt for LLM Nodes
[Feature F007](./features/Feature%20F007%20-%20System%20Prompt%20for%20LLM%20Nodes.md) | **Status: Done**

- ReasoningNode has an optional system prompt textarea
- System prompt is sent to Claude as a system message before the user prompt
- Backend handles optional `system_prompt: Optional[str]` in LLMNodeData

---

## Partially Implemented Features

### F001 — Workflow Import/Export JSON
[Feature F001](./features/Feature%20F001%20-%20Workflow%20Import%20Export%20JSON.md) | **Status: Partial**

- ✅ Users can export the current canvas workflow as a `.json` file download (via Save button)
- ❌ Import not implemented — no button to load JSON files onto canvas

### F019 — Pre-Run Validation
[Feature F019](./features/Feature%20F019%20-%20Pre%20Run%20Validation.md) | **Status: Partial**

- Basic validation exists (checks for empty canvas)
- ❌ Missing: specific error messages for each failure type

---

## Pending Features (Not Implemented)

> **Note:** The following features were documented but never implemented in the UI. They are tracked in their respective feature docs but should not be referenced as working functionality.

### F004 — Execution Cancellation
[Feature F004](./features/Feature%20F004%20-%20Execution%20Cancellation.md) | **Status: Pending**

- Users can cancel a running workflow execution
- Backend: `DELETE /api/executions/{id}` sets status to `cancelled`
- Frontend: Run button becomes "Cancel" button while executing

### F005 — Load Workflow Modal
[Feature F005](./features/Feature%20F005%20-%20Load%20Workflow%20Modal.md) | **Status: Pending**

- "Load" toolbar button opens a modal
- Modal fetches all saved workflows from `GET /api/workflows`

### F009 — Node Execution Logs Panel
[Feature F009](./features/Feature%20F009%20-%20Node%20Execution%20Logs%20Panel.md) | **Status: Pending**

- Toggleable floating panel shows node-by-node execution status

### F010 — Keyboard Shortcuts
[Feature F010](./features/Feature%20F010%20-%20Keyboard%20Shortcuts.md) | **Status: Pending**

- Full keyboard shortcut system via global `keydown` listener

### F011 — Node Tooltip on Hover
[Feature F011](./features/Feature%20F011%20-%20Node%20Tooltip%20on%20Hover.md) | **Status: Pending**

- Floating tooltip appears on node hover

### F012 — Orphaned Node Validation Before Save
[Feature F012](./features/Feature%20F012%20-%20Orphaned%20Node%20Validation%20Before%20Save.md) | **Status: Pending**

- When saving a workflow, warn if any nodes have no incoming or outgoing edges

### F013 — Undo/Redo for Canvas
[Feature F013](./features/Feature%20F013%20-%20Undo%20Redo%20for%20Canvas.md) | **Status: Pending**

- Undo and redo buttons in toolbar

### F014 — New Workflow Button (Clear Canvas)
[Feature F014](./features/Feature%20F014%20-%20New%20Workflow%20Button.md) | **Status: Pending**

- "New" button in toolbar clears the canvas with confirmation

### F015 — Delete Selected Nodes with Delete/Backspace
[Feature F015](./features/Feature%20F015%20-%20Delete%20Selected%20Nodes%20with%20Keyboard.md) | **Status: Pending**

- Pressing Delete or Backspace removes selected nodes

### F017 — Auto-Layout Button (Dagre)
[Feature F017](./features/Feature%20F017%20-%20Auto%20Layout%20Button.md) | **Status: Pending**

- Button arranges all nodes in a left-to-right DAG layout

### F018 — Workflow Stats in Header
[Feature F018](./features/Feature%20F018%20-%20Workflow%20Stats%20in%20Header.md) | **Status: Pending**

- Live node count and edge count displayed in the header bar

### F020 — Help Modal with Keyboard Shortcuts
[Feature F020](./features/Feature%20F020%20-%20Help%20Modal.md) | **Status: Pending**

- Help button in the toolbar
- Opens a modal overlay listing all keyboard shortcuts and canvas features

### F021 — Toast Notifications Instead of alert()
[Feature F021](./features/Feature%20F021%20-%20Toast%20Notifications.md) | **Status: Pending**

- Replace all `alert()` calls with a toast/notification system

---

## Custom Features (Added Beyond Original 21)

These features were added during development but were not in the original F001-F021 spec:

- **Zoom Controls** — Custom zoom group in header (ZoomOut, editable percentage, ZoomIn, Fit)
- **Settings Menu** — Hamburger menu with Theme toggle and MiniMap toggle
- **Editable Zoom** — Click the zoom percentage to type a custom value (10-200%)
