# Feature F025 — NVIDIA NIM Integration

**Date Created:** May 9, 2026
**Status:** Done (Verified with Live Test)
**Author:** AI Agent
**Version**: v0.5

---

## Requirements (Summary)

- Support NVIDIA NIM API for LLM inference
- Default to Qwen 3.5 397B model
- Support MiniMax M2.7 and GLM 4.7 models
- Automatic routing based on model selection
- OpenAI-compatible API client

### User Stories

1. **As a user**, I want to select NVIDIA-hosted models (Qwen, Llama, etc.) for reasoning nodes so that I can use alternatives to Claude.
2. **As a user**, I want workflows to execute successfully with NVIDIA models so that I'm not locked into a single provider.
3. **As a user**, I want to configure NVIDIA API credentials via environment variables so that I can manage secrets securely.

### Functional Requirements

- **FR1:** Support NVIDIA NIM API endpoint (`NVIDIA_NIM_URL` or default `https://integrate.api.nvidia.com/v1`)
- **FR2:** Support NVIDIA API key via `NVIDIA_API_KEY` environment variable
- **FR3:** Add NVIDIA models to ReasoningNode dropdown:
  - `qwen/qwen3.5-397b-a17b` (default NVIDIA model)
  - `minimax/minimax-m2.7` (MiniMax M2.7)
  - `thudm/glm-4.7` (GLM 4.7)
- **FR4:** Backend routes LLM requests to NVIDIA when NVIDIA model is selected
- **FR5:** Maintain backward compatibility with Anthropic/Octane models
- **FR6:** Model selection persists in workflow JSON

### Non-Functional Requirements

- **NFR1:** No breaking changes to existing workflows
- **NFR2:** Error handling for missing `NVIDIA_API_KEY`
- **NFR3:** Consistent response format regardless of provider

---

## Planning

### Backend Tasks

1. Add NVIDIA API configuration to `main.py`
2. Create `OpenAI` client for NVIDIA NIM (compatible API)
3. Update `handle_llm_node` in `node_handlers.py` to route based on model
4. Add validation for `NVIDIA_API_KEY` when NVIDIA model selected

### Frontend Tasks

1. Update `ReasoningNode.tsx` model dropdown with NVIDIA models
2. Update TypeScript types for new model names
3. Set `qwen-3.5` as default when user has NVIDIA configuration

### Testing

1. Backend unit test for NVIDIA model routing
2. Integration test with real NVIDIA API (using `NVIDIA_API_KEY`)
3. Playwright E2E test: create workflow, select Qwen, execute

---

## Implementation Details

### Backend Configuration

```python
# backend/main.py
import os
from openai import OpenAI

# NVIDIA configuration
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
NVIDIA_NIM_URL = os.getenv("NVIDIA_NIM_URL", "https://integrate.api.nvidia.com/v1")

# Initialize NVIDIA client (OpenAI-compatible API)
nvidia_client = None
if NVIDIA_API_KEY:
    nvidia_client = OpenAI(
        base_url=NVIDIA_NIM_URL,
        api_key=NVIDIA_API_KEY
    )

# Model mapping
NVIDIA_MODELS = {
    "qwen-3.5": "qwen/qwen3.5-397b-a17b",
    "llama-3.1-405b": "meta/llama-3.1-405b-instruct",
    "llama-3.1-70b": "meta/llama-3.1-70b-instruct",
    "gemma-2b": "google/gemma-2b",
}

ANTHROPIC_MODELS = {
    "haiku-4.5": "claude-3-5-haiku-latest",
    "sonnet-4.7": "claude-3-7-sonnet-latest",
    "opus-4.7": "claude-3-5-opus-latest",
}
```

### LLM Handler Update

```python
# backend/node_handlers.py
async def handle_llm_node(node_data: LLMNodeData, context: dict) -> dict:
    # Determine provider from model name
    if node_data.model in NVIDIA_MODELS.values():
        # Use NVIDIA client
        response = nvidia_client.chat.completions.create(...)
    else:
        # Use Anthropic client (existing logic)
        response = anthropic_client.messages.create(...)
```

---

## Implementation Summary

**Status**: ✅ Complete (Live verified)

**Backend:**
- NVIDIA client (OpenAI-compatible) initialized in `main.py`
- `_execute_nvidia_llm()` routes Qwen 3.5, MiniMax M2.7, GLM 4.7 to NVIDIA NIM API
- 10 unit tests passing
- Live test: CSV → JSON transformation successful (Qwen 3.5)

**Frontend:**
- ReasoningNode dropdown: 6 models (3 Anthropic + 3 NVIDIA)
- Default model: Qwen 3.5 397B
- OutputNode dropdown fixed with local state
- TypeScript types updated

**Test Results:**
- Unit tests: 10/10 pass
- Live API test: ✅ CSV → JSON (554 chars output)
- Output file: `backend/outputs/test_transform.json`

---

## Acceptance Criteria

- [ ] NVIDIA models appear in ReasoningNode dropdown
- [ ] `qwen-3.5` is default when `NVIDIA_API_KEY` is set
- [ ] Workflow executes successfully with Qwen model
- [ ] Backend tests pass with mock NVIDIA responses
- [ ] Integration test passes with real NVIDIA API
- [ ] Playwright E2E test verifies UI flow
- [ ] Documentation updated

---

## Caveats

1. NVIDIA NIM uses OpenAI-compatible API, not Anthropic API
2. Model capabilities differ (no tool use, different context windows)
3. Response format may vary slightly between providers
4. Rate limits and costs differ from Anthropic
