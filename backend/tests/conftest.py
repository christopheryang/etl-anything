"""
Pytest Configuration and Shared Fixtures

This file contains fixtures that can be used across all test files.
Fixtures are reusable setup code that pytest automatically provides to tests.
"""

import pytest
from fastapi.testclient import TestClient
from pathlib import Path
import tempfile
import shutil


@pytest.fixture
def client():
    """
    Provides a TestClient for making API requests to the FastAPI app.
    
    Usage in tests:
        def test_something(client):
            response = client.get("/")
            assert response.status_code == 200
    """
    from main import app
    return TestClient(app)


@pytest.fixture
def temp_uploads_dir():
    """
    Creates a temporary directory for upload files during testing.
    Automatically cleans up after the test completes.
    
    Usage in tests:
        def test_file_upload(temp_uploads_dir):
            file_path = temp_uploads_dir / "test.txt"
            file_path.write_text("test content")
    """
    temp_dir = Path(tempfile.mkdtemp())
    yield temp_dir
    # Cleanup after test
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def temp_outputs_dir():
    """
    Creates a temporary directory for output files during testing.
    Automatically cleans up after the test completes.
    """
    temp_dir = Path(tempfile.mkdtemp())
    yield temp_dir
    # Cleanup after test
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def sample_workflow():
    """
    Provides a sample workflow definition for testing.
    
    TODO: Implement a valid workflow structure with nodes and edges.
    Students should create realistic workflow examples here.
    """
    # This is a placeholder - students will implement this
    return {
        "nodes": [],
        "edges": []
    }


@pytest.fixture
def mock_anthropic_client():
    """
    Provides a mock Anthropic client for testing without making real API calls.
    
    TODO: Implement a mock that simulates Anthropic API responses.
    Students should use unittest.mock or create a simple mock class.
    """
    # This is a placeholder - students will implement this
    pass

