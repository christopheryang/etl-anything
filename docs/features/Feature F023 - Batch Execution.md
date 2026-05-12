# Feature F023 — Batch Execution

**Status:** In Progress

---

## Requirements

- **FR1:** Batch execution with array of input configurations (files or parameters)
- **FR2:** Each batch run tracks: inputId, inputData, status, executionId, output
- **FR3:** API endpoints: POST /api/batch, GET /api/batch, GET /api/batch/{id}, DELETE /api/batch/{id}, GET /api/batch/{id}/results (ZIP)
- **FR4:** Sequential (default) or parallel execution mode (configurable concurrency, default N=3)
- **FR5:** Frontend batch panel: create batch, monitor progress, view results, download ZIP
- **FR6:** File-based persistence in `backend/batches/`
- **FR7:** Continue-on-error option
- **NFR1:** Batch execution must not block individual execution API
- **NFR2:** Max 10 concurrent runs per batch

---

## Planning

1. Create `BatchManager` class in `backend/batch.py`
2. Implement sequential/parallel execution engine
3. Add 5 API endpoints in `main.py`
4. Create `BatchPanel.tsx` with input config, progress, and results UI
5. ZIP generation for bulk download

---

## Implementation

- `backend/batch.py` — `BatchManager` with `BatchJob`/`BatchRun` dataclasses, file storage, execute_batch (sequential/parallel), generate_zip
- `backend/main.py` — 5 batch endpoints
- `BatchPanel.tsx` — Input configuration, progress bar (X/Y completed), individual run status, download button

---

## Acceptance Criteria

- [ ] Create batch from current workflow with multiple inputs
- [ ] Sequential execution by default, optional parallel mode
- [ ] Progress panel shows all run statuses
- [ ] Stop running batch
- [ ] Download all outputs as ZIP
- [ ] Continue on error when option enabled

---

## Test Cases

- **Sequential batch:** 3 inputs run one after another → all complete
- **Parallel batch:** 3 inputs with N=2 → 2 run concurrently, 1 waits
- **Error handling:** 1 input fails, continue-on-error=true → remaining inputs still execute
- **Stop batch:** DELETE /api/batch/{id} while running → remaining runs skipped
- **ZIP download:** GET /api/batch/{id}/results → valid ZIP with all outputs

---

## Caveats

- Parallel execution can consume significant resources; respect concurrency limits
- Large batches generate many output files; implement cleanup
- Progress tracking granularity depends on individual execution callbacks
- No streaming progress updates — polling only (TODO: SSE)

---

## Files Modified

- `backend/batch.py` (new)
- `backend/main.py` — Batch endpoints
- `frontend/app/components/workflow/BatchPanel.tsx` (new)
- `frontend/app/components/workflow/WorkflowCanvas.tsx` — Batch panel integration
