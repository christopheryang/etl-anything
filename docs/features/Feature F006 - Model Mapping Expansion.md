# Feature F006 — Model Mapping Expansion (Sonnet 4.7, Opus 4.7)

**Status:** Done (backend only)


> **Note:** This is a backend-only feature. No UI component required.**Feature ID:** F006

---

## Requirements

- ReasoningNode dropdown includes three Claude models: Haiku 4.5, Sonnet 4.7, Opus 4.7
- TypeScript type updated to cover all three models
- Backend fallback chains already existed for Sonnet and Opus

---

## Planning

**Problem:** Only Haiku was available in the UI model dropdown despite backend supporting Sonnet and Opus.

**Solution:** Add Sonnet and Opus to the `<select>` in `ReasoningNode.tsx` and update the TypeScript union type.

---

## Implementation Summary

**Files changed:**
- `frontend/app/components/workflow/nodes/ReasoningNode.tsx`
- `frontend/app/components/types/workflow.ts`

**Changes:**
- `<select>` now has three `<option>` elements: claude-haiku-4-5, claude-sonnet-4-7, claude-opus-4-7
- `ReasoningNodeData.model` type updated to union of all three

**Backend:** Already had Sonnet and Opus in `MODEL_FALLBACK_CHAIN`.

---

## Caveats

- No model-specific options (e.g., max_tokens per model) — all share same temperature slider
- The fallback chain means Sonnet can fall back to Haiku, Opus can fall back to Sonnet