# User Guide

## Getting Started

1. **Start the backend** (terminal 1):
 ```bash
 cd backend
 source venv/bin/activate
 uvicorn main:app --reload --port 8001
 ```

2. **Start the frontend** (terminal 2):
 ```bash
 cd frontend
 npm run dev
 ```

3. Open **http://localhost:3001** in your browser.

---

## Interface Layout

The app uses a VS Code / Claude Desktop-style layout:

```
┌──────────┬─────────────────────────────────────────────────────┐
│          │  Chat Panel (top, resizable)                        │
│  Left    │  ┌───────────────────────────────────────────────┐  │
│  Sidebar │  │ "ETL Anything" empty state + example prompt  │  │
│  (Rail)  │  ├───────────────────────────────────────────────┤  │
│          │  │  Conversation history (scrollable)            │  │
│  [Save]  │  ├───────────────────────────────────────────────┤  │
│  [Run]   │  │ Prompt input box + Send button               │  │
│  [Hist]  │  └───────────────────────────────────────────────┘  │
│  [Tmpl]  │  ═══════ Draggable splitter bar ═══════            │
│  [Zoom+] │  Workflow name bar + execution status              │
│  [Zoom-] │  ┌───────────────────────────────────────────────┐  │
│  [Set]   │  │  ReactFlow Canvas (nodes + edges)             │  │
│  [Prof]  │  ├───────────────────────────────────────────────┤  │
│          │  │ Node Library (collapsible, drag-and-drop)     │  │
│          │  └───────────────────────────────────────────────┘  │
└──────────┴─────────────────────────────────────────────────────┘
```

- **Left sidebar** collapses to icon-only or expands to show labels
- **Chat / canvas splitter** is draggable — drag up or down to resize
- **Node Library** panel collapses to a single header bar

---

## Building a Workflow

### With AI (Prompt-to-Workflow)

1. Type a description in the **prompt box** at the bottom of the chat panel
2. Press **Enter** (or click Send) — the AI generates nodes and edges on the canvas
3. Follow-up prompts modify the existing workflow
4. Select an AI model via **Settings** (gear icon in the left sidebar)

### Manually (Drag and Drop)

1. Expand the **Node Library** panel at the bottom of the canvas
2. **Drag** a node tile onto the canvas
3. Drag nodes to reposition them

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
- **Model**: Choose from NVIDIA NIM models (Qwen 3.5, MiniMax, GLM) or Claude models
- **System Prompt** (optional): Sets the system message sent before the user prompt
- **Temperature**: 0.0 (factual) to 1.0 (creative), default 0.7
- **Prompt**: Write your prompt. Use `{{input}}` to reference the previous node's output

#### Output Node
- **File Name**: Name for the output file (no extension)
- **Format**: JSON, TXT, MD, or CSV

#### Rule Node
- **Logic**: Choose **AND** (all conditions must match) or **OR** (any condition can match)
- **Conditions**: Add conditions with:
 - **Variable**: Field path to check (e.g., `status`, `data.score`, `result.0.name`)
 - **Operator**: `==`, `!=`, `>`, `<`, `>=`, `<=`, `is`, `is not`, `in`, `not in`
 - **Value**: Value to compare against
- Click **"+"** to add more conditions

---

## Left Sidebar Reference

The left sidebar contains these controls (top to bottom):

| Icon | Label | Description |
|------|-------|-------------|
| 💾 | **Save Workflow** | Opens save modal — requires a name (rejects "Untitled Workflow"), optional description |
| 📂 | **Open Workflow** | Opens the workflow browser to load a saved workflow |
| ▶ | **Run Workflow** | Starts execution (green button) |
| 🕐 | **History** | Opens the execution history panel |
| 📖 | **Templates** | Opens the template library |
| 🔍+ | **Zoom In** | Zooms in by 15% |
| 🔍- | **Zoom Out** | Zooms out by 15% |
| ⚙ | **Settings** | Opens settings dropdown (theme, minimap, AI model) |
| 👤 | **Profile** | Profile placeholder |

Click the **chevron** at the top of the sidebar to expand/collapse.

---

## Settings Menu

Click the **gear icon** in the left sidebar to open the Settings dropdown:

| Setting | Description |
|---------|-------------|
| **Theme** | Toggle between Light and Dark mode |
| **MiniMap** | Toggle the MiniMap overlay on/off |
| **AI Model** | Select the model used for prompt-to-workflow generation |

---

## Running the Workflow

1. Click the **"Run Workflow"** button (green, in the left sidebar)
2. Watch the status bar below the workflow name for progress
3. When **"Complete"** appears, click **"Download Output"** to get results

---

## Canvas Navigation

- **Pan**: Click and drag on empty canvas space
- **Zoom**: Use the Zoom In/Zoom Out buttons in the left sidebar, or scroll with mouse wheel
- **MiniMap**: Toggle via Settings menu — shows a minimap overview in the canvas corner
- **Resize panels**: Drag the splitter bar between chat and canvas to adjust their sizes

---

## Saving Workflows

1. Click the **"Save Workflow"** button (💾) in the left sidebar
2. A save modal appears — enter a **name** (required; "Untitled Workflow" is rejected)
3. Optionally add a **description**
4. Click **Save** or press Enter

## Opening Saved Workflows

1. Click the **"Open Workflow"** button (📂) in the left sidebar
2. The workflow browser shows a table of all saved workflows
3. **Sort** by clicking any column heading (Name, Created, Updated) — click again to reverse
4. **Navigate pages** using the prev/next buttons (10 per page)
5. **Click a row** to load that workflow into the canvas

---

## Dark Mode

To switch between light and dark mode:

1. Click the **gear icon** (Settings) in the left sidebar
2. Click **Theme** to toggle between Light and Dark
3. The entire UI updates: sidebar, chat, canvas, nodes, and settings all adapt

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

### With AI: Prompt-to-Workflow

Type in the prompt box:
> Read sample_data.csv, filter employees who joined in the last 12 months, split by city, and output a CSV file for each city

The AI will automatically create the Input, Reasoning, Rule, and Output nodes with appropriate configuration.

---

## Troubleshooting

### "Workflow is empty. Please add nodes."

Your workflow has no nodes. Add at least one node to the canvas before running.

### "File not found" during execution

The file referenced in an Input node was deleted from the server. Re-upload the file.

### LLM call fails

Check your `OCTANE_API_KEY` in `backend/.env`. Also check the server logs for specific error messages.

### AI generation fails

Check your `NVIDIA_API_KEY` in `backend/.env`. The prompt-to-workflow feature requires NVIDIA NIM access.

### Workflow runs but output is empty

The Reasoning node prompt may not be referencing `{{input}}` correctly. Make sure the prompt includes `{{input}}` to include the upstream node's output.

### Dark mode isn't working

1. Make sure you're toggling via **Settings → Theme** (not an OS setting)
2. The app uses class-based dark mode (not OS media query)
3. Try refreshing the page if the toggle doesn't take effect immediately
