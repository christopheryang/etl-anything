# Frontend Reference

Complete inventory of all frontend components, their props, key state, and important implementation notes.

---

## File Structure

```
frontend/
  app/
    layout.tsx           ← Root layout with ThemeProvider
    page.tsx             ← Renders <WorkflowCanvas />
    globals.css          ← Tailwind imports + custom styles
    components/
      workflow/
        WorkflowCanvas.tsx   ← MAIN COMPONENT (all state lives here)
        Sidebar.tsx           ← Left sidebar node palette
        nodeConfig.ts         ← NODE_CONFIGS registry + data mappers
        nodes/
          InputNode.tsx       ← File upload node
          ReasoningNode.tsx   ← LLM/reasoning node
          OutputNode.tsx      ← Output file node
          RuleNode.tsx        ← Conditional branching node
      types/
        workflow.ts           ← All TypeScript interfaces
```

---

## WorkflowCanvas.tsx

The central component. Owns ALL ReactFlow state and workflow metadata. No props — reads from parent via `useNodesState` / `useEdgesState`.

### State Variables

| State Variable | Type | Purpose |
|---------------|------|---------|
| `nodes` | `Node[]` | ReactFlow nodes |
| `edges` | `Edge[]` | ReactFlow edges |
| `reactFlowInstance` | `ReactFlowInstance \| null` | Initialized on `onInit` |
| `reactFlow` | from `useReactFlow()` | For undo/redo/fitView |
| `workflowName` | `string` | Current workflow name |
| `workflowId` | `string \| null` | Saved workflow ID (null = unsaved) |
| `hasUnsavedChanges` | `boolean` | True when canvas has unsaved edits (amber dot indicator) |
| `workflowDescription` | `string` | Saved workflow description |
| `workflowStatus` | `string` | `"idle" \| "pending" \| "processing" \| "completed" \| "failed"` |
| `isExecuting` | `boolean` | True while workflow running |
| `currentExecutionId` | `string \| null` | Active execution ID |
| `progress` | `number` | 0–100 progress percentage |
| `statusMessage` | `string` | Human-readable status text |
| `showSaveModal` | `boolean` | Save workflow modal open |
| `showLoadModal` | `boolean` | Load workflow modal open |
| `showLogs` | `boolean` | Logs panel visibility |
| `executionLogs` | `string[]` | Array of log entry strings |
| `showMiniMap` | `boolean` | MiniMap visibility |
| `hoveredNode` | `{id, x, y, info} \| null` | Node hover tooltip state |
| `showHelp` | `boolean` | Help modal visibility — triggered by `?` key or Help button in header |

### Key Functions

| Function | Purpose |
|----------|---------|
| `onNodesChange` | ReactFlow built-in — handles node drag/move/select |
| `onEdgesChange` | ReactFlow built-in — handles edge changes |
| `onConnect` | ReactFlow built-in — handles new connections |
| `onDragOver` / `onDrop` | Drag from sidebar to canvas |
| `runWorkflow()` | Validates, submits to `/api/executions`, starts polling |
| `cancelExecution()` | DELETE to `/api/executions/{id}`, stops polling |
| `saveWorkflow()` | POST (new) or PUT (update) to `/api/workflows`, captures `workflowId` from response |
| `loadWorkflow(id)` | GET `/api/workflows/{id}`, sets nodes/edges/metadata |
| `fetchWorkflows()` | GET `/api/workflows` for load modal |
| `exportWorkflow()` | Downloads canvas as JSON file |
| `importWorkflow(event)` | Reads JSON file, sets nodes/edges |
| `clearWorkflow()` | Resets canvas, metadata, execution state |
| `autoLayout()` | Runs dagre left-to-right layout |
| `getNodeTooltipInfo(node)` | Builds tooltip string per node type |
| `pollExecutionStatus()` | 2-second interval polling callback |

### Toolbar Layout

```
[ETL Anything] [workflow name input] [node count] [edge count] | [Run/Cancel] [Export] [Import] | [New] [Undo] [Redo] [AutoLayout] [Load] [DarkMode] [MiniMap] [Logs]
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd+S | Open Save modal |
| Ctrl/Cmd+O | Open Load modal |
| Ctrl/Cmd+N | Clear canvas |
| Ctrl/Cmd+Z | Undo |
| Ctrl/Cmd+Shift+Z / Ctrl+Y | Redo |
| Delete/Backspace | Delete selected nodes + edges |

---

## nodeConfig.ts

Registry of all node type configurations.

```typescript
interface NodeConfig {
  frontendType: string;
  backendType: string;
  label: string;
  color: string;
  description: string;
  handlePosition?: "top" | "bottom" | "left" | "right";
  dataMapper: (data: any) => Record<string, any>;
}
```

**NODE_CONFIGS keys:** `input`, `reasoning`, `output`, `rule`

**Key functions:**
- `reverseNodeMap` — maps backend type string → frontend type string
- `dataMapper` functions per node type transform ReactFlow node data into the format expected by the backend

---

## Node Components

### InputNode.tsx

**Purpose:** File upload node. User selects a file which gets uploaded to `POST /api/files`.

**State:**
- `fileId` — stored in node `data.fileId`
- `fileName` — stored in node `data.fileName`
- `isUploading` — local UI state during upload

**UI:** Upload button → hidden file input → POST on selection → shows filename on success

**Accepted file types:** `.pdf`, `.txt`, `.md`, `.csv`, `.json`

### ReasoningNode.tsx

**Purpose:** LLM reasoning node. Select model, set temperature, write prompt, optionally set system prompt.

**Props (from ReactFlow):** `data`, `selected`

**State:** All local state maps directly to `data` fields:
- `model` → `data.model` (claude-haiku-4-5 / claude-sonnet-4-7 / claude-opus-4-7)
- `temperature` → `data.temperature` (0.0–1.0)
- `prompt` → `data.prompt` (user prompt with `{{input}}` substitution)
- `systemPrompt` → `data.system_prompt` (optional)

**UI Elements:**
- Model `<select>` dropdown
- Temperature slider (0.0–1.0, step 0.1, default 0.7)
- Prompt textarea (resizable, placeholder with `{{input}}` hint)
- System Prompt textarea (optional, labeled "System Prompt (optional)")

### OutputNode.tsx

**Purpose:** Write workflow result to a file.

**State:**
- `fileName` → `data.fileName`
- `format` → `data.format` (json / txt / csv)

**UI:** Text input for filename, `<select>` for format

### RuleNode.tsx

**Purpose:** Conditional branching with AND/OR logic.

**State:**
- `logic` → `data.logic` (`"AND"` or `"OR"`)
- `conditions` → `data.conditions[]`

**Condition shape:** `{ variable: string, operator: string, value: string }`

**Supported operators:** `==`, `!=`, `>`, `<`, `>=`, `<=`, `is`, `is not`, `in`, `not in`

**UI:** AND/OR toggle, list of condition rows (variable/operator/value inputs), Add Condition button

**Handles:** Two output handles — `"true"` (top, green) and `"false"` (bottom, red) — so downstream nodes can be connected to the appropriate branch.

---

## workflow.ts (Types)

```typescript
interface InputNodeData {
  fileId?: string;
  fileName?: string;
}

interface ReasoningNodeData {
  prompt?: string;
  model?: "claude-haiku-4-5" | "claude-sonnet-4-7" | "claude-opus-4-7";
  temperature?: number;
  system_prompt?: string;
}

interface OutputNodeData {
  fileName?: string;
  format?: "json" | "txt" | "csv";
}

interface RuleNodeData {
  logic?: "AND" | "OR";
  conditions?: Array<{
    variable: string;
    operator: string;
    value: string;
  }>;
}

// Union type used throughout
type NodeData = InputNodeData | ReasoningNodeData | OutputNodeData | RuleNodeData;
```

---

## Sidebar.tsx

Left-side panel listing all available node types. User clicks a node type to add it to the canvas.

**Renders:** List of `NODE_CONFIGS` entries with icon, label, description, and colored indicator dot.

**Drag source:** Each item has `draggable` enabled and `onDragStart` sets `dataTransfer` with the node type string.

---

## Imports Used (WorkflowCanvas.tsx)

```typescript
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Controls,
  Background,
  MiniMap,
  MarkerType,
  ReactFlowProvider,
  Node,
  Edge,
  ReactFlowInstance,
  Connection,
  NodeMouseHandler,
} from "reactflow";
import {
  Play, Save, Download, Upload, X, FolderOpen, Sun, Moon,
  ScrollText, Undo2, Redo2, FilePlus, Trash2, Map, LayoutDashboard,
} from "lucide-react";
import { useTheme } from "next-themes";
import { nodeTypes } from "./nodes";
import { Sidebar } from "./Sidebar";
import { NodeData } from "../types/workflow";
import { NODE_CONFIGS } from "./nodeConfig";
import dagre from "dagre";
```

---

## Dependencies (frontend/package.json)

| Package | Version | Purpose |
|---------|---------|---------|
| `reactflow` | ^11.11.4 | DAG canvas |
| `next-themes` | (installed) | Dark mode |
| `dagre` | (installed) | Auto-layout |
| `@types/dagre` | (installed) | TypeScript types |
| `lucide-react` | (existing) | Icons |