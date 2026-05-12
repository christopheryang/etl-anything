# Feature F006 — Model Mapping Expansion

**Status:** Done (backend only)

---

## Requirements

- **FR1:** ReasoningNode dropdown includes three Claude models: Haiku 4.5, Sonnet 4.7, Opus 4.7
- **FR2:** TypeScript type updated to cover all three models
- **FR3:** Backend fallback chains already existed for Sonnet and Opus
- **NFR1:** No breaking changes to existing functionality

---

## Planning

**Problem:** Only Haiku was available in the UI model dropdown despite backend supporting Sonnet and Opus.

**Solution:** Add Sonnet and Opus to the `<select>` in `ReasoningNode.tsx` and update the TypeScript union type.

---

## Implementation

**Files changed:**
- `frontend/app/components/workflow/nodes/ReasoningNode.tsx`
- `frontend/app/components/types/workflow.ts`

**Changes:**
- `<select>` now has three `<option>` elements: claude-haiku-4-5, claude-sonnet-4-7, claude-opus-4-7
- `ReasoningNodeData.model` type updated to union of all three

**Backend:** Already had Sonnet and Opus in `MODEL_FALLBACK_CHAIN`.

---

## Acceptance Criteria

- [ ] **FR1:** ReasoningNode dropdown includes three Claude models: Haiku 4.5, Sonnet 4.7, Opus 4.7
- [ ] **FR2:** TypeScript type updated to cover all three models
- [ ] **FR3:** Backend fallback chains already existed for Sonnet and Opus
- [ ] **NFR1:** No breaking changes to existing functionality

---

## Test Cases

- Verify feature works per requirements
- Run `cd backend && source venv/bin/activate && python -m pytest tests/ -q`
- Run `cd frontend && npx -p typescript tsc --noEmit`

---

## Caveats

- No model-specific options (e.g., max_tokens per model) — all share same temperature slider
- The fallback chain means Sonnet can fall back to Haiku, Opus can fall back to Sonnet

---

## Files Modified

- `frontend/app/components/workflow/nodes/ReasoningNode.tsx`
- `frontend/app/components/types/workflow.ts`
