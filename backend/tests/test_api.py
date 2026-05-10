"""
Integration Tests for API Endpoints

These tests verify that the API endpoints work correctly end-to-end.
They test the actual HTTP interface of the application.
"""

import pytest
import json
from fastapi.testclient import TestClient


# ============================================================================
# Health Check Endpoint Tests
# ============================================================================

def test_root_endpoint(client):
    """Test the root endpoint returns proper health check response."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "ETL Anything API"
    assert data["status"] == "running"
    assert "version" in data


def test_root_returns_json(client):
    """Test root endpoint returns Content-Type: application/json."""
    response = client.get("/")
    assert response.headers.get("content-type") == "application/json"


# ============================================================================
# Workflow Execution Endpoint Tests
# ============================================================================

def test_execute_workflow_success(client, sample_workflow, monkeypatch):
    """Test successful workflow execution request returns execution_id."""
    # Mock the background task to avoid async issues in tests
    # The endpoint still validates and returns a response before background runs
    response = client.post(
        "/api/workflows/execute",
        json={"workflow": sample_workflow}
    )
    assert response.status_code == 200
    data = response.json()
    assert "execution_id" in data
    assert data["status"] == "queued"
    assert data["message"] == "Workflow execution started"


def test_execute_workflow_with_empty_nodes(client):
    """Test workflow execution fails with empty nodes list."""
    response = client.post(
        "/api/workflows/execute",
        json={"workflow": {"nodes": [], "edges": []}}
    )
    assert response.status_code == 400
    assert "at least one node" in response.json()["detail"].lower()


def test_execute_workflow_with_invalid_edges(client):
    """Test workflow execution fails when edges reference non-existent nodes."""
    workflow = {
        "nodes": [
            {"id": "in1", "type": "input", "position": {"x": 0, "y": 0},
             "data": {"fileId": "test.pdf", "fileName": "test.pdf"}}
        ],
        "edges": [
            {"id": "e1", "source": "in1", "target": "nonexistent"}
        ]
    }
    response = client.post("/api/workflows/execute", json={"workflow": workflow})
    assert response.status_code == 400
    assert "does not exist" in response.json()["detail"]


def test_execute_workflow_without_start_node(client):
    """Test workflow execution fails when no start nodes exist (cycle)."""
    workflow = {
        "nodes": [
            {"id": "a", "type": "llm", "position": {"x": 0, "y": 0},
             "data": {"prompt": "p", "model": "m", "temperature": 0.7}},
            {"id": "b", "type": "llm", "position": {"x": 100, "y": 0},
             "data": {"prompt": "p", "model": "m", "temperature": 0.7}},
        ],
        "edges": [
            {"id": "e1", "source": "a", "target": "b"},
            {"id": "e2", "source": "b", "target": "a"},
        ]
    }
    response = client.post("/api/workflows/execute", json={"workflow": workflow})
    assert response.status_code == 400
    assert "circular" in response.json()["detail"].lower()


def test_execute_workflow_missing_input_file_id(client):
    """Test workflow with input node missing fileId raises 400."""
    workflow = {
        "nodes": [
            {"id": "in1", "type": "input", "position": {"x": 0, "y": 0},
             "data": {"fileId": "", "fileName": ""}},
        ],
        "edges": []
    }
    response = client.post("/api/workflows/execute", json={"workflow": workflow})
    assert response.status_code == 400
    assert "fileId" in response.json()["detail"]


# ============================================================================
# Execution Status Endpoint Tests
# ============================================================================

def test_get_execution_status_not_found(client):
    """Test retrieving status of non-existent execution returns 404."""
    response = client.get("/api/executions/fake-id-123/status")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_download_output_execution_not_found(client):
    """Test downloading output with invalid execution_id returns 404."""
    response = client.get("/api/executions/fake-id-123/download")
    assert response.status_code == 404


# ============================================================================
# Workflow Save/Load Endpoint Tests
# ============================================================================

def test_save_and_load_workflow(client, sample_workflow):
    """Test saving a workflow and loading it back."""
    # Save
    save_response = client.post(
        "/api/workflows",
        json={
            "name": "Test Workflow",
            "description": "A test workflow",
            "workflow": sample_workflow
        }
    )
    assert save_response.status_code == 200
    saved = save_response.json()
    assert saved["name"] == "Test Workflow"
    assert saved["description"] == "A test workflow"
    assert "id" in saved

    workflow_id = saved["id"]

    # Load
    load_response = client.get(f"/api/workflows/{workflow_id}")
    assert load_response.status_code == 200
    loaded = load_response.json()
    assert len(loaded["nodes"]) == len(sample_workflow["nodes"])
    assert len(loaded["edges"]) == len(sample_workflow["edges"])


def test_list_workflows(client, sample_workflow):
    """Test listing saved workflows."""
    # Save two workflows
    for name in ["Workflow A", "Workflow B"]:
        client.post(
            "/api/workflows",
            json={
                "name": name,
                "description": "",
                "workflow": sample_workflow
            }
        )

    response = client.get("/api/workflows")
    assert response.status_code == 200
    data = response.json()
    assert "workflows" in data
    assert len(data["workflows"]) >= 2


def test_load_workflow_not_found(client):
    """Test loading a non-existent workflow returns 404."""
    response = client.get("/api/workflows/does-not-exist")
    assert response.status_code == 404


def test_delete_workflow(client, sample_workflow):
    """Test deleting a saved workflow."""
    # First save one
    save_response = client.post(
        "/api/workflows",
        json={"name": "To Delete", "description": "", "workflow": sample_workflow}
    )
    workflow_id = save_response.json()["id"]

    # Delete it
    del_response = client.delete(f"/api/workflows/{workflow_id}")
    assert del_response.status_code == 200

    # Verify it's gone
    get_response = client.get(f"/api/workflows/{workflow_id}")
    assert get_response.status_code == 404


def test_delete_workflow_not_found(client):
    """Test deleting a non-existent workflow returns 404."""
    response = client.delete("/api/workflows/does-not-exist")
    assert response.status_code == 404


def test_workflow_save_with_rule_node(client):
    """Test saving a workflow that includes a rule node."""
    workflow = {
        "nodes": [
            {"id": "in1", "type": "input", "position": {"x": 0, "y": 0},
             "data": {"fileId": "test.pdf", "fileName": "test.pdf"}},
            {"id": "rule1", "type": "rule", "position": {"x": 100, "y": 0},
             "data": {"conditions": [{"variable": "status", "operator": "==", "value": "active"}],
                      "logic": "AND"}},
            {"id": "out1", "type": "output", "position": {"x": 200, "y": 0},
             "data": {"fileName": "result.txt", "format": "txt"}},
        ],
        "edges": [
            {"id": "e1", "source": "in1", "target": "rule1"},
            {"id": "e2", "source": "rule1", "target": "out1"},
        ]
    }

    response = client.post(
        "/api/workflows",
        json={"name": "Rule Workflow", "description": "", "workflow": workflow}
    )
    assert response.status_code == 200
    saved_id = response.json()["id"]

    # Load and verify
    loaded = client.get(f"/api/workflows/{saved_id}").json()
    rule_node = next(n for n in loaded["nodes"] if n["id"] == "rule1")
    assert rule_node["type"] == "rule"
    assert rule_node["data"]["conditions"][0]["variable"] == "status"