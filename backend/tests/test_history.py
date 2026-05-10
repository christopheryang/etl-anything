# test_history.py - Unit tests for execution history management
import pytest
import json
import time
from pathlib import Path
from datetime import datetime, timezone, timedelta
from history import ExecutionHistory, ExecutionRecord, initialize_history
import shutil


@pytest.fixture
def temp_executions_dir(tmp_path):
    """Create a temporary directory for execution history."""
    exec_dir = tmp_path / "executions"
    exec_dir.mkdir()
    yield str(exec_dir)
    # Cleanup is automatic with tmp_path


@pytest.fixture
def history_instance(temp_executions_dir):
    """Create an ExecutionHistory instance for testing."""
    return ExecutionHistory(temp_executions_dir, max_per_workflow=5, retention_days=7)


@pytest.fixture
def sample_execution_record():
    """Create a sample execution record for testing."""
    return ExecutionRecord(
        executionId="test-exec-001",
        workflowId="workflow-abc",
        workflowName="Test Workflow",
        status="completed",
        startedAt=datetime.now(timezone.utc).isoformat(),
        completedAt=datetime.now(timezone.utc).isoformat(),
        duration=1500,
        nodeResults=[
            {"nodeId": "node1", "status": "completed", "outputPreview": "Output 1"},
            {"nodeId": "node2", "status": "completed", "outputPreview": "Output 2"}
        ],
        inputs={"input1": {"data": "test input"}},
        outputs={"output1": {"result": "test output"}}
    )


class TestExecutionHistorySave:
    """Tests for saving execution records."""
    
    def test_save_execution_creates_file(self, history_instance, sample_execution_record):
        """Verify that saving an execution creates a JSON file."""
        history_instance.save_execution(sample_execution_record)
        
        expected_file = Path(history_instance.executions_dir) / "test-exec-001.json"
        assert expected_file.exists()
        
        # Verify content
        with open(expected_file, 'r') as f:
            data = json.load(f)
        
        assert data['executionId'] == "test-exec-001"
        assert data['workflowName'] == "Test Workflow"
        assert data['status'] == "completed"
    
    def test_save_execution_handles_write_error(self, temp_executions_dir):
        """Verify graceful handling of write errors."""
        history = ExecutionHistory(temp_executions_dir)
        
        # Create invalid record (missing required fields)
        invalid_record = ExecutionRecord(
            executionId="",  # Invalid
            workflowId="",
            workflowName="",
            status="completed",
            startedAt="",
            completedAt=None,
            duration=0,
            nodeResults=[],
            inputs={},
            outputs={}
        )
        
        # Should not raise exception
        history.save_execution(invalid_record)


class TestExecutionHistoryGet:
    """Tests for retrieving execution records."""
    
    def test_get_existing_execution(self, history_instance, sample_execution_record):
        """Verify retrieval of an existing execution."""
        history_instance.save_execution(sample_execution_record)
        
        retrieved = history_instance.get_execution("test-exec-001")
        
        assert retrieved is not None
        assert retrieved.executionId == "test-exec-001"
        assert retrieved.workflowName == "Test Workflow"
    
    def test_get_nonexistent_execution(self, history_instance):
        """Verify None is returned for non-existent execution."""
        result = history_instance.get_execution("does-not-exist")
        assert result is None


class TestExecutionHistoryList:
    """Tests for listing execution records."""
    
    def test_list_all_executions(self, history_instance, sample_execution_record):
        """Verify listing all executions."""
        # Save multiple executions
        for i in range(3):
            record = ExecutionRecord(
                executionId=f"test-exec-00{i+1}",
                workflowId="workflow-abc",
                workflowName="Test Workflow",
                status="completed",
                startedAt=datetime.now(timezone.utc).isoformat(),
                completedAt=datetime.now(timezone.utc).isoformat(),
                duration=1000 + i*100,
                nodeResults=[],
                inputs={},
                outputs={}
            )
            history_instance.save_execution(record)
        
        records = history_instance.list_executions()
        
        assert len(records) == 3
        # Verify sorted by startedAt descending (most recent first)
        assert records[0].executionId == "test-exec-003"
    
    def test_list_executions_filtered_by_workflow(self, history_instance):
        """Verify filtering by workflow ID."""
        # Save executions for different workflows
        for wf_id in ["wf-a", "wf-b", "wf-a"]:
            record = ExecutionRecord(
                executionId=f"exec-{wf_id}-{len(history_instance.list_executions(workflow_id=wf_id))+1}",
                workflowId=wf_id,
                workflowName=f"Workflow {wf_id}",
                status="completed",
                startedAt=datetime.now(timezone.utc).isoformat(),
                completedAt=datetime.now(timezone.utc).isoformat(),
                duration=1000,
                nodeResults=[],
                inputs={},
                outputs={}
            )
            history_instance.save_execution(record)
        
        # Filter by workflow A
        wf_a_records = history_instance.list_executions(workflow_id="wf-a")
        assert len(wf_a_records) == 2
        
        # Filter by workflow B
        wf_b_records = history_instance.list_executions(workflow_id="wf-b")
        assert len(wf_b_records) == 1
    
    def test_list_executions_with_limit(self, history_instance):
        """Verify limit parameter works correctly."""
        # Save 10 executions
        for i in range(10):
            record = ExecutionRecord(
                executionId=f"exec-{i:03d}",
                workflowId="workflow-abc",
                workflowName="Test Workflow",
                status="completed",
                startedAt=datetime.now(timezone.utc).isoformat(),
                completedAt=datetime.now(timezone.utc).isoformat(),
                duration=1000,
                nodeResults=[],
                inputs={},
                outputs={}
            )
            history_instance.save_execution(record)
        
        # List with limit
        records = history_instance.list_executions(limit=5)
        assert len(records) == 5


class TestExecutionHistoryDelete:
    """Tests for deleting execution records."""
    
    def test_delete_existing_execution(self, history_instance, sample_execution_record):
        """Verify deletion of an existing execution."""
        history_instance.save_execution(sample_execution_record)
        
        result = history_instance.delete_execution("test-exec-001")
        assert result is True
        
        # Verify file is deleted
        retrieved = history_instance.get_execution("test-exec-001")
        assert retrieved is None
    
    def test_delete_nonexistent_execution(self, history_instance):
        """Verify deletion of non-existent execution returns False."""
        result = history_instance.delete_execution("does-not-exist")
        assert result is False


class TestExecutionHistoryCleanup:
    """Tests for cleanup functionality."""
    
    def test_cleanup_workflow_history_respects_max(self, history_instance):
        """Verify that old executions are cleaned up when limit is exceeded."""
        # Save 7 executions (max is 5)
        # Note: Most recent first, so exec-006 is oldest, exec-000 is newest
        for i in range(7):
            record = ExecutionRecord(
                executionId=f"exec-{i:03d}",
                workflowId="workflow-abc",
                workflowName="Test Workflow",
                status="completed",
                startedAt=(datetime.now(timezone.utc) - timedelta(hours=i)).isoformat(),
                completedAt=datetime.now(timezone.utc).isoformat(),
                duration=1000,
                nodeResults=[],
                inputs={},
                outputs={}
            )
            history_instance.save_execution(record)
        
        # Should have only 5 executions (most recent by startedAt)
        records = history_instance.list_executions(workflow_id="workflow-abc")
        assert len(records) == 5
        
        # Verify oldest were deleted (exec-005, exec-006 had older timestamps)
        # Most recent are exec-000 through exec-004 (smaller i = more recent)
        execution_ids = [r.executionId for r in records]
        assert "exec-005" not in execution_ids
        assert "exec-006" not in execution_ids
        assert "exec-000" in execution_ids
        assert "exec-004" in execution_ids
    
    def test_cleanup_old_executions(self, temp_executions_dir):
        """Verify cleanup of executions older than retention period."""
        history = ExecutionHistory(temp_executions_dir, retention_days=7)
        
        # Create old execution (10 days ago)
        old_date = datetime.now(timezone.utc) - timedelta(days=10)
        old_record = ExecutionRecord(
            executionId="old-exec",
            workflowId="workflow-abc",
            workflowName="Old Workflow",
            status="completed",
            startedAt=old_date.isoformat(),
            completedAt=old_date.isoformat(),
            duration=1000,
            nodeResults=[],
            inputs={},
            outputs={}
        )
        history.save_execution(old_record)
        
        # Create recent execution
        recent_record = ExecutionRecord(
            executionId="recent-exec",
            workflowId="workflow-abc",
            workflowName="Recent Workflow",
            status="completed",
            startedAt=datetime.now(timezone.utc).isoformat(),
            completedAt=datetime.now(timezone.utc).isoformat(),
            duration=1000,
            nodeResults=[],
            inputs={},
            outputs={}
        )
        history.save_execution(recent_record)
        
        # Cleanup old executions
        deleted = history.cleanup_old_executions(days=7)
        
        assert deleted == 1
        assert history.get_execution("old-exec") is None
        assert history.get_execution("recent-exec") is not None


class TestExecutionHistoryStats:
    """Tests for execution statistics."""
    
    def test_get_stats_empty_history(self, history_instance):
        """Verify stats for empty history."""
        stats = history_instance.get_execution_stats()
        
        assert stats["total"] == 0
        assert stats["completed"] == 0
        assert stats["failed"] == 0
        assert stats["cancelled"] == 0
        assert stats["success_rate"] == 0
    
    def test_get_stats_with_mixed_statuses(self, history_instance):
        """Verify stats calculation with mixed execution statuses."""
        # Save executions with different statuses
        statuses = ["completed", "completed", "failed", "cancelled", "completed"]
        for i, status in enumerate(statuses):
            record = ExecutionRecord(
                executionId=f"exec-{i}",
                workflowId="workflow-abc",
                workflowName="Test Workflow",
                status=status,
                startedAt=datetime.now(timezone.utc).isoformat(),
                completedAt=datetime.now(timezone.utc).isoformat(),
                duration=1000 if status == "completed" else 500,
                nodeResults=[],
                inputs={},
                outputs={}
            )
            history_instance.save_execution(record)
        
        stats = history_instance.get_execution_stats()
        
        assert stats["total"] == 5
        assert stats["completed"] == 3
        assert stats["failed"] == 1
        assert stats["cancelled"] == 1
        assert stats["success_rate"] == 60.0  # 3/5 = 60%


class TestInitializeHistory:
    """Tests for the initialize_history helper function."""
    
    def test_initialize_creates_global_instance(self, temp_executions_dir):
        """Verify initialize_history creates and returns an instance."""
        from history import history, initialize_history
        
        # Reset global
        import history as history_module
        history_module.history = None
        
        result = initialize_history(temp_executions_dir, max_per_workflow=10)
        
        assert result is not None
        assert history_module.history is not None
        assert result.max_per_workflow == 10


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
