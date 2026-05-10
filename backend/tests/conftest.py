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
import json


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
    """
    temp_dir = Path(tempfile.mkdtemp())
    yield temp_dir
    # Cleanup after test
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def sample_workflow():
    """
    Provides a sample workflow definition for testing.

    Returns a simple 3-node workflow: input -> llm -> output
    """
    return {
        "nodes": [
            {
                "id": "input_1",
                "type": "input",
                "position": {"x": 100, "y": 100},
                "data": {
                    "fileId": "test-file.txt",
                    "fileName": "test.txt"
                }
            },
            {
                "id": "llm_1",
                "type": "llm",
                "position": {"x": 300, "y": 100},
                "data": {
                    "prompt": "Summarize the following text:",
                    "model": "claude-haiku-4-5",
                    "temperature": 0.7
                }
            },
            {
                "id": "output_1",
                "type": "output",
                "position": {"x": 500, "y": 100},
                "data": {
                    "fileName": "summary.txt",
                    "format": "txt"
                }
            }
        ],
        "edges": [
            {"id": "e1", "source": "input_1", "target": "llm_1"},
            {"id": "e2", "source": "llm_1", "target": "output_1"}
        ]
    }


@pytest.fixture
def sample_pdf_path(temp_uploads_dir):
    """
    Creates a minimal valid PDF file for testing and returns the path.
    """
    # Minimal PDF with one page of text
    pdf_content = b"""%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/Resources<</Font<</F1<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>>>>>/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 44>>
stream
BT
/F1 12 Tf
100 700 Td
(Hello World) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000217 00000 n
trailer<</Size 5/Root 1 0 R>>
startxref
309
%%EOF"""
    pdf_path = temp_uploads_dir / "test.pdf"
    pdf_path.write_bytes(pdf_content)
    return pdf_path


class MockAnthropicResponse:
    """Mock response object that mimics anthropic.Message object."""

    def __init__(self, text: str):
        self.content = [MockContent(text)]


class MockContent:
    """Mock content block."""

    def __init__(self, text: str):
        self.type = "text"
        self.text = text


@pytest.fixture
def mock_anthropic_client(monkeypatch):
    """
    Provides a mock Anthropic client for testing without making real API calls.

    Intercepts messages.create() to return mock responses.
    """
    class MockMessages:
        def __init__(self, response_text: str = "Mocked LLM response"):
            self.response_text = response_text
            self.call_count = 0
            self.last_kwargs = None

        def create(self, **kwargs):
            self.call_count += 1
            self.last_kwargs = kwargs
            return MockAnthropicResponse(self.response_text)

    mock_messages = MockMessages()

    class MockAnthropicClient:
        def __init__(self, **kwargs):
            self.messages = mock_messages

    # Patch the Anthropic class in both main and node_handlers modules
    import main
    import node_handlers

    monkeypatch.setattr(main, "Anthropic", MockAnthropicClient)
    monkeypatch.setattr(node_handlers, "Anthropic", MockAnthropicClient)

    return mock_messages