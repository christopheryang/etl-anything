"""
Tests for Prompt-to-Workflow generation (F027).

Covers:
- prompt_builder: system prompt construction
- /api/workflows/generate endpoint: happy path + error cases
"""

import json
import pytest
from unittest.mock import patch, MagicMock

from prompt_builder import build_workflow_generation_prompt, NODE_CATALOG


# ---------------------------------------------------------------------------
# Prompt builder tests
# ---------------------------------------------------------------------------

class TestPromptBuilder:
    """Tests for the system prompt builder."""

    def test_includes_available_files(self):
        """Prompt should mention each uploaded file."""
        prompt = build_workflow_generation_prompt(
            available_files=["sample_data.csv", "employees.json"]
        )
        assert "sample_data.csv" in prompt
        assert "employees.json" in prompt

    def test_no_files_note(self):
        """Prompt should handle empty file list gracefully."""
        prompt = build_workflow_generation_prompt(available_files=[])
        assert "No files have been uploaded" in prompt

    def test_includes_all_node_types(self):
        """Prompt should document all 4 node types."""
        prompt = build_workflow_generation_prompt(available_files=["test.csv"])
        for node_type in NODE_CATALOG:
            assert node_type in prompt

    def test_includes_current_workflow(self):
        """Prompt should serialize the current workflow when provided."""
        current_wf = {
            "nodes": [
                {
                    "id": "input_1",
                    "type": "input",
                    "position": {"x": 100, "y": 200},
                    "data": {"fileId": "sample_data.csv", "fileName": "sample_data.csv"},
                }
            ],
            "edges": [],
        }
        prompt = build_workflow_generation_prompt(
            available_files=["sample_data.csv"],
            current_workflow=current_wf,
        )
        assert "input_1" in prompt
        assert "already has a workflow" in prompt

    def test_no_current_workflow(self):
        """Prompt should not mention current workflow when none provided."""
        prompt = build_workflow_generation_prompt(available_files=["test.csv"])
        assert "already has a workflow" not in prompt

    def test_includes_output_format(self):
        """Prompt must specify the exact JSON output format."""
        prompt = build_workflow_generation_prompt(available_files=["test.csv"])
        assert '"explanation"' in prompt
        assert '"nodes"' in prompt
        assert '"edges"' in prompt

    def test_includes_edge_schema(self):
        """Prompt should document the edge schema."""
        prompt = build_workflow_generation_prompt(available_files=["test.csv"])
        assert "sourceHandle" in prompt


# ---------------------------------------------------------------------------
# Endpoint tests (using FastAPI TestClient)
# ---------------------------------------------------------------------------

class TestGenerateWorkflowEndpoint:
    """Tests for POST /api/workflows/generate."""

    @pytest.fixture
    def client(self):
        """Create a test client with a mocked NVIDIA client."""
        from fastapi.testclient import TestClient
        # Patch nvidia_client before importing the app
        with patch("main.nvidia_client", create=True) as mock_nvidia:
            # We need to re-import or use the existing app
            from main import app
            # Store mock for test use
            self.mock_nvidia = mock_nvidia
            client = TestClient(app)
            yield client

    def _make_llm_response(self, explanation, nodes, edges):
        """Build a mock LLM response object."""
        content = json.dumps({
            "explanation": explanation,
            "nodes": nodes,
            "edges": edges,
        })
        mock_choice = MagicMock()
        mock_choice.message.content = content
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]
        return mock_response

    def test_generate_happy_path(self):
        """Endpoint should return a valid GenerateWorkflowResponse."""
        from fastapi.testclient import TestClient
        from main import app

        sample_nodes = [
            {
                "id": "input_1",
                "type": "input",
                "position": {"x": 100, "y": 200},
                "data": {"fileId": "sample_data.csv", "fileName": "sample_data.csv"},
            },
            {
                "id": "output_1",
                "type": "output",
                "position": {"x": 700, "y": 200},
                "data": {"fileName": "result.csv", "format": "csv"},
            },
        ]
        sample_edges = [
            {"id": "e-input_1-output_1", "source": "input_1", "target": "output_1"},
        ]

        mock_response = self._make_llm_response(
            "Created a simple ETL pipeline.", sample_nodes, sample_edges
        )

        with patch("main.nvidia_client") as mock_nvidia:
            mock_nvidia.chat.completions.create.return_value = mock_response
            client = TestClient(app)

            response = client.post(
                "/api/workflows/generate",
                json={
                    "prompt": "Read sample_data.csv and output as CSV",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert "explanation" in data
        assert "workflow" in data
        assert len(data["workflow"]["nodes"]) == 2
        assert len(data["workflow"]["edges"]) == 1

    def test_generate_no_nvidia_client(self):
        """Should return 503 when NVIDIA client is not configured."""
        from fastapi.testclient import TestClient
        from main import app

        with patch("main.nvidia_client", None):
            client = TestClient(app)
            response = client.post(
                "/api/workflows/generate",
                json={"prompt": "test"},
            )

        assert response.status_code == 503
        assert "NVIDIA_API_KEY" in response.json()["detail"]

    def test_generate_llm_wrapped_in_markdown(self):
        """Should handle LLM response wrapped in ```json...``` blocks."""
        from fastapi.testclient import TestClient
        from main import app

        sample_nodes = [
            {
                "id": "input_1",
                "type": "input",
                "position": {"x": 100, "y": 200},
                "data": {"fileId": "data.csv", "fileName": "data.csv"},
            },
        ]
        sample_edges = []

        # Wrap in markdown code block
        raw_json = json.dumps({
            "explanation": "Simple input node.",
            "nodes": sample_nodes,
            "edges": sample_edges,
        })
        content = f"```json\n{raw_json}\n```"

        mock_choice = MagicMock()
        mock_choice.message.content = content
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]

        with patch("main.nvidia_client") as mock_nvidia:
            mock_nvidia.chat.completions.create.return_value = mock_response
            client = TestClient(app)

            response = client.post(
                "/api/workflows/generate",
                json={"prompt": "Read data.csv"},
            )

        assert response.status_code == 200
        data = response.json()
        assert len(data["workflow"]["nodes"]) == 1

    def test_generate_llm_returns_invalid_json(self):
        """Should return 502 when LLM returns invalid JSON."""
        from fastapi.testclient import TestClient
        from main import app

        mock_choice = MagicMock()
        mock_choice.message.content = "This is not JSON at all!"
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]

        with patch("main.nvidia_client") as mock_nvidia:
            mock_nvidia.chat.completions.create.return_value = mock_response
            client = TestClient(app)

            response = client.post(
                "/api/workflows/generate",
                json={"prompt": "Do something impossible"},
            )

        assert response.status_code == 502
        assert "invalid JSON" in response.json()["detail"]

    def test_generate_llm_missing_fields(self):
        """Should return 502 when LLM JSON is missing required fields."""
        from fastapi.testclient import TestClient
        from main import app

        content = json.dumps({"explanation": "Oops", "nodes": []})
        mock_choice = MagicMock()
        mock_choice.message.content = content
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]

        with patch("main.nvidia_client") as mock_nvidia:
            mock_nvidia.chat.completions.create.return_value = mock_response
            client = TestClient(app)

            response = client.post(
                "/api/workflows/generate",
                json={"prompt": "Create a workflow"},
            )

        assert response.status_code == 502

    def test_generate_with_current_workflow(self):
        """Should pass current workflow to the prompt builder."""
        from fastapi.testclient import TestClient
        from main import app

        sample_nodes = [
            {
                "id": "input_1",
                "type": "input",
                "position": {"x": 100, "y": 200},
                "data": {"fileId": "data.csv", "fileName": "data.csv"},
            },
        ]
        mock_response = self._make_llm_response(
            "Modified workflow.", sample_nodes, []
        )

        with patch("main.nvidia_client") as mock_nvidia:
            mock_nvidia.chat.completions.create.return_value = mock_response
            client = TestClient(app)

            response = client.post(
                "/api/workflows/generate",
                json={
                    "prompt": "Add a filter",
                    "current_workflow": {
                        "nodes": [
                            {
                                "id": "input_1",
                                "type": "input",
                                "position": {"x": 100, "y": 200},
                                "data": {"fileId": "data.csv", "fileName": "data.csv"},
                            }
                        ],
                        "edges": [],
                    },
                },
            )

        assert response.status_code == 200

    def test_generate_converts_llm_type_to_reasoning(self):
        """Should convert backend 'llm' type to frontend 'reasoning' type."""
        from fastapi.testclient import TestClient
        from main import app

        sample_nodes = [
            {
                "id": "input_1",
                "type": "input",
                "position": {"x": 100, "y": 200},
                "data": {"fileId": "data.csv", "fileName": "data.csv"},
            },
            {
                "id": "llm_1",
                "type": "llm",  # Backend naming
                "position": {"x": 400, "y": 200},
                "data": {
                    "prompt": "Summarize",
                    "model": "qwen/qwen3.5-397b-a17b",
                    "temperature": 0.7,
                },
            },
        ]
        sample_edges = [
            {"id": "e-input_1-llm_1", "source": "input_1", "target": "llm_1"},
        ]

        mock_response = self._make_llm_response(
            "Added LLM node.", sample_nodes, sample_edges
        )

        with patch("main.nvidia_client") as mock_nvidia:
            mock_nvidia.chat.completions.create.return_value = mock_response
            client = TestClient(app)

            response = client.post(
                "/api/workflows/generate",
                json={"prompt": "Add a summarization step"},
            )

        assert response.status_code == 200
        data = response.json()
        # The llm node should be converted to reasoning
        for node in data["workflow"]["nodes"]:
            assert node["type"] != "llm", "Node type 'llm' should be converted to 'reasoning'"
