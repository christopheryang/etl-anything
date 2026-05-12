# Feature F025 — NVIDIA NIM Integration

**Status:** Done (Live Verified)

---

## Requirements

- **FR1:** Support NVIDIA NIM API endpoint (default: `https://integrate.api.nvidia.com/v1`)
- **FR2:** NVIDIA API key via `NVIDIA_API_KEY` env var
- **FR3:** NVIDIA models in ReasoningNode dropdown: qwen/qwen3.5-397b-a17b, minimax/minimax-m2.7, thudm/glm-4.7
- **FR4:** Backend routes LLM requests to NVIDIA when NVIDIA model selected
- **FR5:** Backward compatible with Anthropic/Octane models
- **FR6:** Model selection persists in workflow JSON
- **NFR1:** No breaking changes to existing workflows
- **NFR2:** Graceful 503 when `NVIDIA_API_KEY` missing
- **NFR3:** Consistent response format regardless of provider

---

## Planning

1. Add NVIDIA OpenAI-compatible client to `main.py`
2. Create `_execute_nvidia_llm()` handler routing NVIDIA models to NIM API
3. Update `handle_llm_node` in `node_handlers.py` to branch on model name
4. Add NVIDIA models to ReasoningNode dropdown + TypeScript types

---

## Implementation

- `backend/main.py` — `nvidia_client = OpenAI(base_url=NVIDIA_NIM_URL, api_key=NVIDIA_API_KEY)`
- `backend/node_handlers.py` — `_execute_nvidia_llm()` for NVIDIA models, existing Anthropic path unchanged
- `NVIDIA_MODELS` dict maps short names to full model IDs
- `ANTHROPIC_MODELS` dict preserved for backward compatibility
- ReasoningNode dropdown: 6 models (3 Anthropic + 3 NVIDIA)
- Default model: qwen/qwen3.5-397b-a17b when NVIDIA_API_KEY is set

---

## Acceptance Criteria

- [ ] NVIDIA models appear in ReasoningNode dropdown
- [ ] Qwen 3.5 is default when NVIDIA_API_KEY is set
- [ ] Workflow executes successfully with Qwen model
- [ ] 503 returned when NVIDIA_API_KEY missing
- [ ] Anthropic models still work (backward compatible)

---

## Test Cases

- **NVIDIA routing:** Select qwen-3.5 → request goes to NVIDIA NIM, not Anthropic
- **Missing API key:** No NVIDIA_API_KEY → 503 with clear error message
- **Anthropic fallback:** Select haiku-4.5 → existing Anthropic path unchanged
- **Live test:** CSV → JSON transformation with Qwen 3.5 → successful output
- **10 unit tests** passing with mocked NVIDIA responses

---

## Caveats

- NVIDIA NIM uses OpenAI-compatible API, not Anthropic — different response structure
- Model capabilities differ (no tool use, different context windows)
- Rate limits and costs differ from Anthropic
- Response format may vary slightly between providers

---

## Files Modified

- `backend/main.py` — NVIDIA client, model dicts, generate endpoint
- `backend/node_handlers.py` — `_execute_nvidia_llm()` handler
- `frontend/app/components/workflow/nodes/ReasoningNode.tsx` — Model dropdown
- `frontend/app/components/types/workflow.ts` — Model type union
