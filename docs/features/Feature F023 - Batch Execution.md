# Feature F023 — Batch Execution

**Date Created:** May 9, 2026  
**Status:** In Progress  
**Author:** AI Agent

---

## Requirements

### User Stories

1. **As a user**, I want to execute multiple workflows in sequence so that I can process multiple input files without manual intervention.
2. **As a user**, I want to run the same workflow with different parameters (A/B testing) so that I can compare outputs.
3. **As a user**, I want to see the progress of all batch executions so that I know which ones have completed.
4. **As a user**, I want to stop a running batch job so that I can prevent wasting resources on unwanted executions.

### Functional Requirements

- **FR1:** Batch execution definition includes:
  - `batchId` (unique identifier)
  - `workflowId` (workflow to execute)
  - `workflowDefinition` (nodes and edges)
  - `inputs` (array of input configurations to run)
  - `createdAt` (ISO timestamp)
  - `status` (pending, running, completed, failed, stopped)
- **FR2:** Each batch input includes:
  - `inputId` (unique identifier within batch)
  - `inputData` (fileId, variables, or parameters for this run)
  - `status` (pending, running, completed, failed)
  - `executionId` (reference to actual execution)
  - `output` (result from this run)
- **FR3:** API endpoints:
  - `POST /api/batch` - Start a batch execution
  - `GET /api/batch` - List all batch jobs
  - `GET /api/batch/{batchId}` - Get batch job details with all runs
  - `DELETE /api/batch/{batchId}` - Stop and delete a batch job
  - `GET /api/batch/{batchId}/results` - Download all outputs as ZIP
- **FR4:** Execution modes:
  - **Sequential**: Run inputs one at a time (default)
  - **Parallel**: Run up to N inputs concurrently (configurable, default N=3)
- **FR5:** Frontend Batch Panel:
  - Create batch from current workflow
  - Specify multiple inputs (file uploads or parameter values)
  - Monitor progress: X of Y completed
  - View individual run results
  - Download all outputs as ZIP
- **FR6:** Batch persists across sessions (file-based storage in `backend/batches/`)
- **FR7:** Continue on error: Option to continue batch even if individual runs fail

### Non-Functional Requirements

- **NFR1:** Batch execution should not block individual execution API
- **NFR2:** Maximum 10 concurrent batch runs per batch job (configurable)
- **NFR3:** Progress updates via polling or Server-Sent Events (SSE)

---

## Planning

### Backend Tasks

1. Create `backend/batch.py` module with `BatchManager` class
2. Define Pydantic models: `BatchJob`, `BatchRun`, `BatchCreateRequest`
3. Implement batch execution engine (sequential/parallel modes)
4. Add API endpoints in `main.py`
5. File-based storage in `backend/batches/` directory
6. ZIP file generation for bulk download

### Frontend Tasks

1. Create `BatchPanel.tsx` component
2. Add "Batch Execute" button to toolbar
3. Input configuration UI (add/remove inputs, upload files)
4. Progress monitoring with individual run status
5. Results view with download options

### Testing Tasks

1. Backend unit tests for batch management
2. Tests for sequential vs parallel execution
3. E2E tests for batch creation and monitoring

---

## Implementation Details

### Backend Structure

```python
# backend/batch.py
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Literal
from pathlib import Path
import json
from datetime import datetime, timezone
import asyncio
from concurrent.futures import ThreadPoolExecutor

@dataclass
class BatchRun:
    inputId: str
    inputData: Dict[str, Any]
    status: Literal["pending", "running", "completed", "failed", "skipped"]
    executionId: Optional[str] = None
    output: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    startedAt: Optional[str] = None
    completedAt: Optional[str] = None

@dataclass
class BatchJob:
    batchId: str
    workflowId: str
    workflowName: str
    workflowDefinition: Dict[str, Any]
    runs: List[BatchRun]
    status: Literal["pending", "running", "completed", "failed", "stopped"]
    mode: Literal["sequential", "parallel"]
    maxConcurrent: int = 3
    continueOnError: bool = True
    createdAt: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completedAt: Optional[str] = None

class BatchManager:
    def __init__(self, batches_dir: str):
        self.batches_dir = Path(batches_dir)
        self.batches_dir.mkdir(exist_ok=True)
    
    def create_batch(self, job: BatchJob) -> None:
        # Save batch to disk
        pass
    
    def get_batch(self, batch_id: str) -> Optional[BatchJob]:
        # Load batch from disk
        pass
    
    def list_batches(self, limit: int = 50) -> List[BatchJob]:
        # List all batches
        pass
    
    def delete_batch(self, batch_id: str) -> bool:
        # Delete batch (stop if running)
        pass
    
    async def execute_batch(self, job: BatchJob) -> None:
        # Execute all runs in batch (sequential or parallel)
        pass
    
    def generate_zip(self, batch_id: str) -> Path:
        # Create ZIP file of all outputs
        pass
```

### API Endpoints

```python
# POST /api/batch
async def create_batch(request: BatchCreateRequest):
    # Create batch job, start execution in background
    pass

# GET /api/batch
async def list_batches(limit: int = 50):
    # Return list of batch jobs with summary
    pass

# GET /api/batch/{batch_id}
async def get_batch(batch_id: str):
    # Return full batch details including all runs
    pass

# DELETE /api/batch/{batch_id}
async def delete_batch(batch_id: str):
    # Stop batch if running, delete from disk
    pass

# GET /api/batch/{batch_id}/results
async def download_batch_results(batch_id: str):
    # Generate and return ZIP file
    pass
```

### Frontend Component

```typescript
// BatchPanel.tsx
interface BatchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  workflowDefinition?: WorkflowDefinition;
}

interface BatchRunStatus {
  inputId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  error?: string;
}
```

---

## Caveats & Considerations

1. **Resource Usage**: Parallel execution can consume significant resources; implement rate limiting
2. **Error Handling**: Decide whether to stop entire batch on first error or continue
3. **Output Management**: Large batches can generate many output files; implement cleanup
4. **Concurrency Limits**: Respect backend execution limits when running parallel batches
5. **Progress Tracking**: Individual execution progress may not map cleanly to batch progress

---

## Acceptance Criteria

- [ ] Users can create a batch from current workflow
- [ ] Users can specify multiple inputs (files or parameters)
- [ ] Batch executes in sequential mode by default
- [ ] Optional parallel mode with configurable concurrency
- [ ] Progress panel shows status of all runs
- [ ] Individual run results accessible
- [ ] Option to stop running batch
- [ ] Download all outputs as ZIP file
- [ ] Backend tests pass (90%+ coverage)
- [ ] Documentation updated in USER_GUIDE.md
