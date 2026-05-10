# User Guide

## Getting Started

1. **Start the backend** (terminal 1):
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn main:app --reload --port 8000
   ```

2. **Start the frontend** (terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```

3. Open **http://localhost:3000** in your browser.

---

## Building a Workflow

### Adding Nodes

1. **Drag** a node tile from the **Node Library** (left sidebar) onto the canvas
2. Drag nodes to reposition them on the canvas

### Connecting Nodes

1. Hover over a node to see its connection handles (small circles on edges)
2. Click and drag from a handle to another node's handle to create an edge
3. For **Rule nodes**: connect to the **"T"** (true) or **"F"** (false) handle to create conditional branches

### Configuring Nodes

Click any node to expand its configuration panel:

#### Input Node
- Click **"Upload File"** to select a PDF, TXT, MD, CSV, or JSON file
- The file is uploaded to the backend and referenced by ID

#### Reasoning Node (LLM)
- **Model**: Choose Claude Haiku 4.5, Sonnet 4.7, or Opus 4.7
- **System Prompt** (optional): Sets the system message sent to Claude before the user prompt
- **Temperature**: 0.0 (factual) to 1.0 (creative), default 0.7
- **Prompt**: Write your prompt. Use `{{input}}` to reference the previous node's output

#### Output Node
- **File Name**: Name for the output file (no extension)
- **Format**: JSON, TXT, or CSV

#### Rule Node
- **Logic**: Choose **AND** (all conditions must match) or **OR** (any condition can match)
- **Conditions**: Add conditions with:
  - **Variable**: Field path to check (e.g., `status`, `data.score`, `result.0.name`)
  - **Operator**: `==`, `!=`, `>`, `<`, `>=`, `<=`, `is`, `is not`, `in`, `not in`
  - **Value**: Value to compare against
- Click **"+"** to add more conditions

### Running the Workflow

1. Click the **"Run Workflow"** button (top header bar, green)
2. Watch the status bar for progress (polling every 2 seconds)
3. When **"Complete"** appears, click **"Download Output"** to get results

---

## Toolbar Reference

The top header bar contains these controls (left to right):

| Element | Description |
|---------|-------------|
| **Workflow Name** | Editable text field — click to rename your workflow |
| **Zoom Out** (-) | Zooms out by 15% |
| **Zoom %** | Shows current zoom level. **Click to edit** — type a value (10-200) and press Enter |
| **Zoom In** (+) | Zooms in by 15% |
| **Fit** (expand icon) | Fits all nodes into the current viewport |
| **Run Workflow** | Starts execution (green button) |
| **Download Output** | Appears after successful execution — downloads the output file |
| **Save** | Saves the current workflow to the backend |
| **Settings** (hamburger icon) | Opens the Settings dropdown (far right) |

---

## Settings Menu

Click the **hamburger icon** (far right of the header) to open the Settings dropdown:

| Setting | Description |
|---------|-------------|
| **Theme** | Toggle between Light and Dark mode. Shows Moon icon in light mode, Sun icon in dark mode. |
| **MiniMap** | Toggle the MiniMap overlay on/off. Shows "On" (teal) or "Off" (gray). |
| **Zoom info** | Displays the current zoom percentage (read-only in menu) |

---

## Dark Mode

To switch between light and dark mode:

1. Click the **hamburger icon** (Settings) in the top-right of the header
2. Click **Theme** to toggle between Light and Dark
3. The entire UI updates: header, sidebar, canvas, nodes, and settings menu all adapt

Dark mode changes:
- Background switches from light gray to dark gray/black
- Cards and panels switch from white to dark gray
- Text switches from dark to light
- Borders adjust for visibility on dark surfaces

---

## Canvas Navigation

- **Pan**: Click and drag on empty canvas space
- **Zoom**: Use the toolbar zoom buttons, or scroll with mouse wheel
- **Edit zoom**: Click the percentage display in the toolbar, type a number (10-200), press Enter
- **Fit view**: Click the expand icon in the zoom controls to fit all nodes in view
- **MiniMap**: Toggle via Settings menu — shows a minimap overview in the bottom-right corner

---

## Saving Workflows

1. Click the **"Save"** button in the toolbar
2. The workflow is saved to the backend as a JSON file

> **Note:** Load/Import functionality is not yet implemented. See Feature F005 and F001 in the feature docs for planned functionality.

---

## Example Workflows

### Simple ETL: Input PDF → Reasoning → Output

```
[Input: upload.pdf] → [Reasoning: summarize] → [Output: result.json]
```

1. Drag an Input node onto the canvas, upload a PDF
2. Drag a Reasoning node, set prompt: "Summarize this document in 3 sentences: {{input}}"
3. Drag an Output node, name it "summary"
4. Connect: Input → Reasoning → Output
5. Click **Run Workflow**

### Conditional Routing: Input → Rule → Reasoning or Output

```
[Input: data.json] → [Rule: score > 50] ─┬─→ [Reasoning: analyze] → [Output]
                                         └ false path → [Output: low_score.json]
```

1. Upload a JSON file with numeric fields
2. Add a Rule node with condition: `score > 50`
3. Add two downstream paths:
   - True handle → Reasoning → Output
   - False handle → Output (low_score.json)
4. Run — the workflow follows the appropriate branch based on the data

---

## Troubleshooting

### "Workflow is empty. Please add nodes."

Your workflow has no nodes. Add at least one node to the canvas before running.

### "File not found" during execution

The file referenced in an Input node was deleted from the server. Re-upload the file.

### LLM call fails

Check your `OCTANE_API_KEY` in `backend/.env`. Also check the server logs for specific error messages.

### Workflow runs but output is empty

The Reasoning node prompt may not be referencing `{{input}}` correctly. Make sure the prompt includes `{{input}}` to include the upstream node's output.

### Dark mode isn't working

1. Make sure you're toggling via **Settings → Theme** (not an OS setting)
2. The app uses class-based dark mode (not OS media query)
3. Try refreshing the page if the toggle doesn't take effect immediately
