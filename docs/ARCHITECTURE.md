# Architecture

## System Overview

ETL Anything is a full-stack workflow engine. The **frontend** is a Next.js visual DAG editor (ReactFlow) where users compose pipelines by dragging nodes and connecting them. The **backend** is a FastAPI service that receives a workflow definition, executes nodes in topological order, and returns results.

```
                                    HTTP POST /api/executions
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │                                              │
                    ▼                                              ▼
┌────────────────────────────────────┐    ┌────────────────────────────────────┐
│  ReactFlow Canvas (Next.js)        │    │  FastAPI Backend (main.py)         │
│                                    │    │                                    │
│  ┌─────────────────────────────┐  │    │  ┌────────────────────────────┐   │
│  │  WorkflowCanvas.tsx         │  │    │  │  POST /api/executions      │   │
│  │  - owns all nodes/edges     │──┼────┼─▶│  execute_node_recursive()  │   │
│  │  - execution state         │  │    │  │  (DAG topological walk)     │   │
│  │  - toolbar + modals         │  │    │  └────────────┬───────────────┘   │
│  └─────────────────────────────┘  │    │               │                   │
│                                   │    │    ┌──────────┼──────────┐        │
│  ┌─────────────────────────────┐  │    │    ▼          ▼          ▼        │
│  │  Sidebar (node palette)    │  │    │  ┌──────┐ ┌──────┐ ┌──────┐      │
│  │  InputNode                  │  │    │  │input_│ │ llm_ │ │output│      │
│  │  ReasoningNode              │  │    │  │node  │ │ node │ │ node │      │
│  │  OutputNode                 │  │    │  └──────┘ └──────┘ └──────┘      │
│  │  RuleNode                   │  │    │              │          │        │
│  └─────────────────────────────┘  │    │      ┌────────┴────────┐         │
│                                   │    │      ▼                 ▼           │
│  Polling: GET /api/executions/   │    │  [Claude API]    [write file]      │
│  every 2s ◀───────────────────────┼────┼─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─           │
└────────────────────────────────────┘    └────────────────────────────────────┘
```

---

## Frontend Architecture

### Component Tree

```
app/
├── layout.tsx                    ← ThemeProvider (next-themes)
└── page.tsx                      ← Renders <WorkflowCanvas />

components/workflow/
├── WorkflowCanvas.tsx             ← MAIN: all state, toolbar, modals
├── Sidebar.tsx                    ← Node palette (draggable list)
├── nodeConfig.ts                  ← NODE_CONFIGS registry
└── nodes/
    ├── InputNode.tsx              ← File upload → POST /api/files
    ├── ReasoningNode.tsx          ← Model dropdown, temp slider, prompt
    ├── OutputNode.tsx             ← Filename + format selector
    └── RuleNode.tsx               ← Conditions builder, AND/OR toggle
```

### State in WorkflowCanvas.tsx

```
Node State          Edge State         Execution State        Modal State
─────────────        ──────────         ──────────────         ──────────
nodes: Node[]        edges: Edge[]      workflowStatus         showSaveModal
setNodes()          setEdges()         isExecuting            showLoadModal
onNodesChange()      onEdgesChange()    currentExecutionId    showHelp
                     onConnect()        progress               showMiniMap
                                        statusMessage          showLogs

Metadata             Canvas Helpers     Polling
────────────         ─────────────     ─────────
workflowName        reactFlow.fitView  pollingIntervalRef
workflowId           autoLayout(dagre)  pollExecutionStatus()
workflowDescription  clearWorkflow()
```

### Node Type Mapping

```
Frontend Type      Backend Type      Handler Function          Data Fields
──────────────      ────────────      ──────────────           ──────────
input               input              handle_input_node         fileId, fileName
reasoning           llm                handle_llm_node           prompt, model, temperature, system_prompt
output              output             handle_output_node        fileName, format
rule                rule                handle_rule_node          logic, conditions[]
```

### Execution Flow

```
runWorkflow()
│
├─ Validate: nodes.length > 0, edges.length > 0, has input node, has output node
│
├─ POST /api/executions { workflow: { nodes, edges } }
│   └─ receive execution_id
│
├─ set isExecuting = true, workflowStatus = "pending"
│
├─ pollingIntervalRef = setInterval(pollExecutionStatus, 2000)
│   │
│   └─ GET /api/executions/{id}
│       ├─ status = "running" → update progress
│       ├─ status = "completed" → stop polling, enable download
│       ├─ status = "failed" → stop polling, show error
│       └─ status = "cancelled" → stop polling, reset
│
└─ cancelExecution() → DELETE /api/executions/{id}
```

---

## Backend Architecture

### Route Map (main.py)

```
FastAPI app
│
├── GET  /                              → service info
│
├── /api/workflows
│   ├── GET    /api/workflows            → list all saved workflows
│   ├── POST   /api/workflows           → save workflow to JSON file
│   └── GET    /api/workflows/{id}       → load workflow by ID
│
├── /api/executions
│   ├── POST   /api/executions          → start execution, return exec_id
│   ├── GET    /api/executions/{id}     → poll status + results
│   ├── DELETE /api/executions/{id}     → cancel running execution
│   └── GET    /api/executions/{id}/download → download output file
│
└── /api/files
    ├── GET    /api/files               → list uploaded files
    ├── POST   /api/files               → upload file (multipart)
    └── GET    /api/files/{filename}    → download file
```

### Execution Registry

```
executions: Dict[str, ExecutionState]

ExecutionState {
    status: Literal["pending","running","completed","failed","cancelled"]
    started_at: datetime
    completed_at: datetime | None
    node_results: Dict[str, str]   # node_id → result string
    error: str | None
}

# In-memory only. Each execution lives for the duration of the process.
# No persistence, no database.
```

### DAG Execution Algorithm

```
execute_node_recursive(node_id, incoming_results, execution_id):

    1. Build adjacency list from edges
         edges = [(source, target, sourceHandle?)]
         adjacency[source].append((target, handle))

    2. Gather upstream results
         upstream = [(src_id, result) for src_id, _ in incoming_edges[node_id]]

    3. Determine input_data
         if single upstream → input_data = result
         if multiple upstream → input_data = concatenated results

    4. Route to handler
         handler = NODE_HANDLERS[node.type]
         result = handler(node, execution_id, input_data, **kwargs)

    5. Store result
         executions[execution_id].node_results[node_id] = result

    6. Determine downstream
         downstream_edges = adjacency[node_id]
         for rule nodes: filter by true/false handle based on rule evaluation

    7. Recurse
         for each downstream edge:
             execute_node_recursive(target_id, upstream_results, execution_id)
```

### Rule Node Branching Logic

```
                     ┌─────────────────────────┐
                     │     evaluate_rule()    │
                     │  conditions + logic    │
                     └───────────┬─────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
              result = TRUE              result = FALSE
                    │                         │
    edges from "true" handle          edges from "false" handle
                    │                         │
                    ▼                         ▼
          downstream nodes            downstream nodes
          (continue execution)        (skip branch)
```

### Node Handler Reference

```
handle_input_node(node, execution_id, input_data, **kwargs)
│
├─ node.data.fileId → resolve to backend/uploads/{fileId}
├─ Route by extension:
│   ├─ .pdf  → PyMuPDF(pdf_path).extract_text()
│   ├─ .txt  → open(path).read()
│   ├─ .md   → open(path).read()
│   ├─ .csv  → csv.reader → join rows
│   └─ .json → json.load → stringify
└─ return extracted_text

handle_llm_node(node, execution_id, input_data, anthropic_client, **kwargs)
│
├─ Substitute {{input}} in node.data.prompt with input_data
├─ model = node.data.model
├─ system_prompt = node.data.system_prompt (optional)
├─ Call anthropic_client.messages.create(
│       model=model,
│       max_tokens=1024,
│       messages=[{"role":"user","content":prompt}]
│   )
│   └─ Handle TimeoutError → retry with next model in MODEL_FALLBACK_CHAIN
└─ return response.content[0].text

handle_output_node(node, execution_id, input_data, **kwargs)
│
├─ fileName = node.data.fileName
├─ format = node.data.format (json/txt/csv)
├─ output_path = outputs/{execution_id}.{format}
├─ Write formatted input_data to output_path
└─ return output_path

handle_rule_node(node, execution_id, input_data, **kwargs)
│
├─ conditions = node.data.conditions[]
├─ logic = node.data.logic ("AND" or "OR")
├─ For each condition:
│   ├─ Parse variable (supports dot notation: "data.score")
│   ├─ Apply operator (==, !=, >, <, >=, <=, is, is not, in, not in)
│   └─ Compare against value (case-insensitive for strings)
├─ Combine results with AND (all true) or OR (any true)
└─ return "true" or "false" string
```

---

## Data Flow Diagrams

### Workflow Execution

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              Workflow Execution Flow                                   │
└──────────────────────────────────────────────────────────────────────────────────────┘

  User clicks "Run"
         │
         ▼
  ┌─────────────────────────────────┐
  │  Frontend validates workflow    │
  │  - has nodes?                  │
  │  - has edges?                  │
  │  - input node has file?        │
  │  - has output node?           │
  └─────────────┬───────────────────┘
                │ OK
                ▼
  POST /api/executions { workflow: { nodes, edges } }
         │
         ▼
  ┌─────────────────────────────────┐
  │  Backend: DAG topological sort │
  │  Build adjacency + incoming map│
  └─────────────┬───────────────────┘
                │
                ▼
  ┌─────────────────────────────────┐
  │  Find root nodes (no incoming)  │
  └─────────────┬───────────────────┘
                │
         ┌──────┴───────────────────────────────────┐
         ▼                                          ▼
  ┌─────────────┐                           ┌─────────────┐
  │ InputNode   │                           │ InputNode   │  (parallel roots)
  └──────┬──────┘                           └──────┬──────┘
         │                                       │
         ▼                                       ▼
  handle_input_node()                    handle_input_node()
  (read file from uploads/)              (read file)
         │                                       │
         │  ┌────────────────────────────────────┘
         │  │ (merge if multiple upstream)
         ▼  ▼
  ┌─────────────┐
  │ LLMNode     │
  │ (prompt +   │
  │  {{input}}) │
  └──────┬──────┘
         │
         ▼
  handle_llm_node()
  (call Claude API)
         │
         ├─────────────────┐
         ▼                 ▼
  ┌─────────────┐   ┌─────────────┐
  │ OutputNode  │   │ RuleNode    │  (branch)
  │ (save)      │   │ (evaluate)  │
  └──────┬──────┘   └──────┬──────┘
         │                 │
         │         ┌───────┴───────┐
         │         ▼              ▼
         │   ┌──────────┐   ┌──────────┐
         │   │ LLMNode  │   │ LLMNode  │  (true/false branches)
         │   │ (true)   │   │ (false)  │
         │   └────┬─────┘   └────┬─────┘
         │        │              │
         │        ▼              ▼
         │   ┌──────────┐   ┌──────────┐
         │   │ OutputN. │   │ OutputN. │
         │   └──────────┘   └──────────┘
         │
         ▼
  Final output written to outputs/{execution_id}.{format}
         │
         ▼
  Frontend polling receives "completed"
         │
         ▼
  "Download" button enabled
```

### File Upload Flow

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              File Upload Flow                                       │
└──────────────────────────────────────────────────────────────────────────────────┘

  User clicks upload on InputNode
         │
         ▼
  Hidden <input type="file"> triggered
         │
         ▼
  User selects file (e.g., doc.pdf)
         │
         ▼
  ┌─────────────────────────────────┐
  │  Frontend:                      │
  │  POST /api/files (FormData)     │
  │  - field: "file"               │
  │  - file: doc.pdf                │
  └─────────────┬───────────────────┘
                │
                ▼
  ┌─────────────────────────────────┐
  │  Backend:                       │
  │  - save to uploads/{uuid}.pdf   │
  │  - return { fileId, fileName }  │
  └─────────────┬───────────────────┘
                │
                ▼
  Frontend stores in node.data:
    { fileId: "uuid", fileName: "doc.pdf" }
         │
         ▼
  Workflow saved with fileId reference
         │
         ▼
  Execution: handle_input_node() reads
             backend/uploads/{fileId} by UUID
             (original filename preserved in storage)
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **No database** | Workflows stored as JSON files in `backend/workflows/`. Simple, zero-config, workshop-friendly. |
| **DAG execution by recursion** | `execute_node_recursive` walks the graph topologically. Rule nodes branch by selectively following true/false handles. |
| **Model fallback chain** | Prevents dead ends when a model is unavailable. Haiku fails → Sonnet → Opus → error. |
| **Frontend-backend type mapping** | Frontend uses `frontendType` (input/reasoning/output/rule), backend uses `backendType` (input/llm/output/rule). Mapping defined in `nodeConfig.ts`. |
| **Execution polling** | Frontend polls every 2s. Simple, works through proxies. WebSocket is the future. |
| **In-memory execution registry** | `executions: Dict[str, ExecutionState]` lives in process memory. No persistence. Cancels work on restart. |
| **File storage by UUID** | Uploaded files stored as `{uuid}` with original filename preserved in metadata. Avoids filename collisions. |