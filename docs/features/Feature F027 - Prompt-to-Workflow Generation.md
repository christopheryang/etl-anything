# Feature F027 — Prompt-to-Workflow Generation

**Status:** Done
**Version:** v0.6.0

---

## Requirements

- **FR1:** Chat-style prompt interface for describing ETL workflows in natural language
- **FR2:** AI generates complete workflow (nodes + edges + configs) from user description
- **FR3:** AI explanation appears in chat after generation
- **FR4:** Follow-up prompts include current workflow state for iterative modification
- **FR5:** Model selector in Settings dropdown lets users pick the generation model
- **FR6:** Backend `POST /api/workflows/generate` accepts `prompt`, `model`, optional `current_workflow`
- **FR7:** System prompt provides LLM with node types, schemas, available files, and JSON output format
- **FR8:** Backend strips markdown code fences from LLM response for robustness
- **FR9:** Backend converts `type: "llm"` to `type: "reasoning"` for frontend compatibility
- **NFR1:** Generation < 30 seconds for typical workflows
- **NFR2:** No real API calls in tests (mocked)
- **NFR3:** Graceful 503 when NVIDIA_API_KEY not configured

---

## Planning

**Problem:** Users must manually drag and configure every node. Non-technical users can't create workflows.

**Solution:** Chat-first interface where users describe workflows in plain English. Backend sends prompt + node schemas to NVIDIA NIM, parses JSON response into ReactFlow nodes/edges.

---

## Implementation

### Backend

- `prompt_builder.py` — Builds system prompt listing node types, schemas, uploaded files, and expected JSON format
- `POST /api/workflows/generate` — Calls NVIDIA NIM with chosen model, strips code fences, validates JSON, converts `llm` → `reasoning`
- `GenerateWorkflowRequest` accepts `prompt`, `model` (default: `qwen/qwen3.5-397b-a17b`), `current_workflow`

### Frontend

- `ChatPanel.tsx` — Conversation UI with message history, empty state with "ETL Anything" branding, prompt input with placeholder example
- `LeftSidebar.tsx` — Icon rail with Settings dropdown containing model selector
- `NodeLibrary.tsx` — Collapsible drag-and-drop panel (like VS Code terminal)
- `WorkflowCanvas.tsx` — Vertical split: ChatPanel (draggable height) on top, Canvas below
- `/api/workflows/generate/route.ts` — Next.js proxy to FastAPI backend

---

## Acceptance Criteria

- [ ] User types workflow description, presses Enter, AI generates nodes/edges on canvas
- [ ] AI explanation appears in chat
- [ ] Follow-up prompts modify existing workflow (current_workflow sent to backend)
- [ ] Model selector changes generation model
- [ ] Draggable splitter resizes chat/canvas panels
- [ ] 503 returned when NVIDIA_API_KEY missing
- [ ] Markdown code fences stripped from LLM response
- [ ] 87/87 backend tests pass, zero new TS errors

---

## Test Cases

- **Happy path:** POST with valid prompt → 200 + nodes/edges
- **Missing prompt:** POST with empty prompt → 422
- **No API key:** POST without NVIDIA_API_KEY → 503
- **Markdown-wrapped JSON:** LLM returns \`\`\`json...\`\`\` → parsed correctly
- **Type conversion:** LLM returns `type: "llm"` → converted to `"reasoning"`
- **Model param:** POST with custom model → backend uses specified model
- **Frontend E2E:** Type prompt → nodes appear on canvas

---

## Caveats / TODOs

- No cross-session conversation persistence (lost on refresh) — TODO: localStorage
- LLM may hallucinate invalid node types — TODO: stricter schema validation
- Single shared API key — TODO: per-user keys
- No rate limiting on generate endpoint — TODO: add limits
- No streaming (full response only) — TODO: SSE streaming
- File awareness lists filenames only, not content/schema — TODO: sample file headers

---

## Files Modified

- `backend/prompt_builder.py` (new)
- `backend/main.py` — GenerateWorkflowRequest + endpoint
- `backend/tests/test_generate_workflow.py` (new)
- `frontend/app/components/workflow/ChatPanel.tsx` (new)
- `frontend/app/components/workflow/LeftSidebar.tsx` (new)
- `frontend/app/components/workflow/NodeLibrary.tsx` (new)
- `frontend/app/api/workflows/generate/route.ts` (new)
- `frontend/app/components/workflow/WorkflowCanvas.tsx` — Layout refactor
- `frontend/app/components/types/workflow.ts` — PromptMessage type
