# history.py - Execution History Management
from pathlib import Path
from typing import Optional, Dict, Any, List
import json
from datetime import datetime, timezone, timedelta
import logging
from dataclasses import dataclass, asdict

logger = logging.getLogger("workflow_engine")


@dataclass
class ExecutionRecord:
    executionId: str
    workflowId: str
    workflowName: str
    status: str  # completed, failed, cancelled
    startedAt: str
    completedAt: Optional[str]
    duration: int  # milliseconds
    nodeResults: List[Dict[str, Any]]
    inputs: Dict[str, Any]
    outputs: Dict[str, Any]
    error: Optional[str] = None


class ExecutionHistory:
    """File-based execution history storage."""
    
    def __init__(self, executions_dir: str, max_per_workflow: int = 100, retention_days: int = 30):
        self.executions_dir = Path(executions_dir)
        self.executions_dir.mkdir(exist_ok=True)
        self.max_per_workflow = max_per_workflow
        self.retention_days = retention_days
        logger.info(f"ExecutionHistory initialized: {self.executions_dir.absolute()}")
        logger.info(f"Retention policy: {retention_days} days, max {max_per_workflow} per workflow")
    
    def _get_execution_path(self, execution_id: str) -> Path:
        """Get the file path for an execution record."""
        return self.executions_dir / f"{execution_id}.json"
    
    def save_execution(self, record: ExecutionRecord) -> None:
        """Save an execution record to disk."""
        try:
            path = self._get_execution_path(record.executionId)
            with open(path, 'w') as f:
                json.dump(asdict(record), f, indent=2)
            logger.info(f"Saved execution history: {record.executionId}")
            
            # Cleanup old executions for this workflow
            self._cleanup_workflow_history(record.workflowId)
        except Exception as e:
            logger.error(f"Failed to save execution history: {e}")
    
    def get_execution(self, execution_id: str) -> Optional[ExecutionRecord]:
        """Load an execution record by ID."""
        try:
            path = self._get_execution_path(execution_id)
            if not path.exists():
                return None
            
            with open(path, 'r') as f:
                data = json.load(f)
            return ExecutionRecord(**data)
        except Exception as e:
            logger.error(f"Failed to load execution {execution_id}: {e}")
            return None
    
    def list_executions(self, workflow_id: Optional[str] = None, limit: int = 100) -> List[ExecutionRecord]:
        """List execution records, optionally filtered by workflow ID."""
        try:
            records = []
            for path in self.executions_dir.glob("*.json"):
                try:
                    with open(path, 'r') as f:
                        data = json.load(f)
                    record = ExecutionRecord(**data)
                    
                    # Filter by workflow if specified
                    if workflow_id and record.workflowId != workflow_id:
                        continue
                    
                    records.append(record)
                except Exception as e:
                    logger.warning(f"Failed to load execution file {path}: {e}")
                    continue
            
            # Sort by startedAt descending (most recent first)
            records.sort(key=lambda r: r.startedAt, reverse=True)
            
            # Apply limit
            return records[:limit]
        except Exception as e:
            logger.error(f"Failed to list executions: {e}")
            return []
    
    def delete_execution(self, execution_id: str) -> bool:
        """Delete an execution record."""
        try:
            path = self._get_execution_path(execution_id)
            if not path.exists():
                return False
            
            path.unlink()
            logger.info(f"Deleted execution history: {execution_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete execution {execution_id}: {e}")
            return False
    
    def _cleanup_workflow_history(self, workflow_id: str) -> None:
        """Keep only the most recent N executions per workflow."""
        try:
            records = self.list_executions(workflow_id=workflow_id, limit=self.max_per_workflow + 10)
            
            if len(records) > self.max_per_workflow:
                # Delete oldest executions beyond the limit
                to_delete = records[self.max_per_workflow:]
                for record in to_delete:
                    self.delete_execution(record.executionId)
                    logger.info(f"Auto-deleted old execution {record.executionId} (limit: {self.max_per_workflow})")
        except Exception as e:
            logger.warning(f"Failed to cleanup workflow history: {e}")
    
    def cleanup_old_executions(self, days: Optional[int] = None) -> int:
        """Remove executions older than N days. Returns count of deleted records."""
        if days is None:
            days = self.retention_days
        
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        deleted = 0
        
        try:
            for record in self.list_executions(limit=1000):
                started = datetime.fromisoformat(record.startedAt.replace('Z', '+00:00'))
                if started < cutoff:
                    if self.delete_execution(record.executionId):
                        deleted += 1
            
            logger.info(f"Cleaned up {deleted} executions older than {days} days")
        except Exception as e:
            logger.error(f"Failed to cleanup old executions: {e}")
        
        return deleted
    
    def get_execution_stats(self, workflow_id: Optional[str] = None) -> Dict[str, Any]:
        """Get statistics about executions."""
        records = self.list_executions(workflow_id=workflow_id, limit=1000)
        
        if not records:
            return {
                "total": 0,
                "completed": 0,
                "failed": 0,
                "cancelled": 0,
                "avg_duration_ms": 0,
                "success_rate": 0
            }
        
        completed = [r for r in records if r.status == "completed"]
        failed = [r for r in records if r.status == "failed"]
        cancelled = [r for r in records if r.status == "cancelled"]
        
        avg_duration = sum(r.duration for r in completed) / len(completed) if completed else 0
        
        return {
            "total": len(records),
            "completed": len(completed),
            "failed": len(failed),
            "cancelled": len(cancelled),
            "avg_duration_ms": round(avg_duration, 2),
            "success_rate": round(len(completed) / len(records) * 100, 2) if records else 0
        }


# Global instance (will be initialized in main.py)
history: Optional[ExecutionHistory] = None


def initialize_history(executions_dir: str, **kwargs) -> ExecutionHistory:
    """Initialize the global history instance."""
    global history
    history = ExecutionHistory(executions_dir, **kwargs)
    return history
