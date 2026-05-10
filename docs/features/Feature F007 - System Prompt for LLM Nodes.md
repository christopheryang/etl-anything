# Feature F007 — System Prompt for LLM Nodes

**Status:** Done (backend only)


> **Note:** This is a backend-only feature. No UI component required.**Feature ID:** F007

---

## Requirements

- ReasoningNode has an optional system prompt textarea
- System prompt is sent to Claude as a system message before the user prompt
- Backend handles optional `system_prompt: Optional[str]` in LLMNodeData

---

## Planning

**Problem:** No way to set Claude's system/instructions context — all prompting had to go in the user prompt.

**Solution:** Add `system_prompt` field to LLM node data on both frontend and backend. Backend builds messages list with optional system role first.

---

## Implementation Summary

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

## Caveats

- No character limit indicator on the system prompt textarea
- System prompt is not validated before sending to API