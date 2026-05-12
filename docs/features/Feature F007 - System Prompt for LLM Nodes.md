# Feature F007 — System Prompt for LLM Nodes

**Status:** Done (backend only)

---

## Requirements

- **FR1:** ReasoningNode has an optional system prompt textarea
- **FR2:** System prompt is sent to Claude as a system message before the user prompt
- **FR3:** Backend handles optional `system_prompt: Optional[str]` in LLMNodeData
- **NFR1:** No breaking changes to existing functionality

---

## Planning

**Problem:** No way to set Claude's system/instructions context — all prompting had to go in the user prompt.

**Solution:** Add `system_prompt` field to LLM node data on both frontend and backend. Backend builds messages list with optional system role first.

---

## Implementation

**Files changed:**
- `backend/main.py` (`LLMNodeData.system_prompt`)
- `backend/node_handlers.py` (messages building)
- `frontend/app/components/workflow/nodes/ReasoningNode.tsx`
- `frontend/app/components/types/workflow.ts`

**Frontend:** Textarea labeled "System Prompt (optional)" added below temperature slider. `system_prompt?: string` in TypeScript interface.

**Backend:** `handle_llm_node` builds messages as:
```python
messages = []
if system_prompt:
    messages.append({"role": "system", "content": system_prompt})
messages.append({"role": "user", "content": full_prompt})
```

---

## Acceptance Criteria

- [ ] **FR1:** ReasoningNode has an optional system prompt textarea
- [ ] **FR2:** System prompt is sent to Claude as a system message before the user prompt
- [ ] **FR3:** Backend handles optional `system_prompt: Optional[str]` in LLMNodeData
- [ ] **NFR1:** No breaking changes to existing functionality

---

## Test Cases

- Verify feature works per requirements
- Run `cd backend && source venv/bin/activate && python -m pytest tests/ -q`
- Run `cd frontend && npx -p typescript tsc --noEmit`

---

## Caveats

- No character limit indicator on the system prompt textarea
- System prompt is not validated before sending to API

---

## Files Modified

- `backend/main.py` (`LLMNodeData.system_prompt`)
- `backend/node_handlers.py` (messages building)
- `frontend/app/components/workflow/nodes/ReasoningNode.tsx`
- `frontend/app/components/types/workflow.ts`
