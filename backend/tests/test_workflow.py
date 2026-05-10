"""
Unit Tests for Workflow Engine Functions

These tests verify individual workflow engine functions in isolation.
They focus on the core logic without hitting the API layer.
"""

import pytest
from main import parse_workflow_graph, execute_node, WorkflowDefinition, Node, Edge
from main import (
    InputNodeData, LLMNodeData, OutputNodeData, RuleNodeData, RuleCondition
)
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))


# ============================================================================
# Workflow Graph Parsing Tests
# ============================================================================

class TestParseWorkflowGraph:
    """Tests for parse_workflow_graph function."""

    def test_simple_linear_workflow(self):
        """Test parsing a simple input -> llm -> output workflow."""
        workflow = WorkflowDefinition(
            nodes=[
                Node(id="in1", type="input", position={"x": 0, "y": 0},
                     data=InputNodeData(fileId="test.pdf", fileName="test.pdf")),
                Node(id="llm1", type="llm", position={"x": 100, "y": 0},
                     data=LLMNodeData(prompt="Summarize", model="claude-haiku-4-5", temperature=0.7)),
                Node(id="out1", type="output", position={"x": 200, "y": 0},
                     data=OutputNodeData(fileName="out.txt", format="txt")),
            ],
            edges=[
                Edge(id="e1", source="in1", target="llm1"),
                Edge(id="e2", source="llm1", target="out1"),
            ]
        )
        node_lookup, adjacency_list, incoming_edges, start_nodes = parse_workflow_graph(workflow)

        assert len(node_lookup) == 3
        assert start_nodes == ["in1"]
        assert adjacency_list["in1"] == ["llm1"]
        assert adjacency_list["llm1"] == ["out1"]
        assert incoming_edges["in1"] == []
        assert incoming_edges["llm1"] == [("in1", None)]
        assert incoming_edges["out1"] == [("llm1", None)]

    def test_empty_workflow_raises(self):
        """Test that a workflow with no nodes raises ValueError."""
        workflow = WorkflowDefinition(nodes=[], edges=[])
        with pytest.raises(ValueError, match="at least one node"):
            parse_workflow_graph(workflow)

    def test_invalid_edge_source_raises(self):
        """Test that an edge with non-existent source raises ValueError."""
        workflow = WorkflowDefinition(
            nodes=[
                Node(id="in1", type="input", position={"x": 0, "y": 0},
                     data=InputNodeData(fileId="test.pdf", fileName="test.pdf")),
            ],
            edges=[
                Edge(id="e1", source="nonexistent", target="in1"),
            ]
        )
        with pytest.raises(ValueError, match="does not exist"):
            parse_workflow_graph(workflow)

    def test_invalid_edge_target_raises(self):
        """Test that an edge with non-existent target raises ValueError."""
        workflow = WorkflowDefinition(
            nodes=[
                Node(id="in1", type="input", position={"x": 0, "y": 0},
                     data=InputNodeData(fileId="test.pdf", fileName="test.pdf")),
            ],
            edges=[
                Edge(id="e1", source="in1", target="nonexistent"),
            ]
        )
        with pytest.raises(ValueError, match="does not exist"):
            parse_workflow_graph(workflow)

    def test_no_start_nodes_circular_raises(self):
        """Test that a fully cyclic graph raises a cycle-specific error."""
        workflow = WorkflowDefinition(
            nodes=[
                Node(id="a", type="llm", position={"x": 0, "y": 0},
                     data=LLMNodeData(prompt="p", model="m", temperature=0.7)),
                Node(id="b", type="llm", position={"x": 100, "y": 0},
                     data=LLMNodeData(prompt="p", model="m", temperature=0.7)),
            ],
            edges=[
                Edge(id="e1", source="a", target="b"),
                Edge(id="e2", source="b", target="a"),
            ]
        )
        with pytest.raises(ValueError, match="circular"):
            parse_workflow_graph(workflow)

    def test_input_node_missing_file_id_raises(self):
        """Test that an input node without fileId raises ValueError."""
        workflow = WorkflowDefinition(
            nodes=[
                Node(id="in1", type="input", position={"x": 0, "y": 0},
                     data=InputNodeData(fileId="", fileName="")),
            ],
            edges=[]
        )
        with pytest.raises(ValueError, match="fileId"):
            parse_workflow_graph(workflow)

    def test_multiple_start_nodes(self):
        """Test workflow with two parallel start nodes (both have no incoming edges)."""
        workflow = WorkflowDefinition(
            nodes=[
                Node(id="in1", type="input", position={"x": 0, "y": 0},
                     data=InputNodeData(fileId="a.pdf", fileName="a.pdf")),
                Node(id="in2", type="input", position={"x": 0, "y": 100},
                     data=InputNodeData(fileId="b.pdf", fileName="b.pdf")),
                Node(id="out1", type="output", position={"x": 200, "y": 50},
                     data=OutputNodeData(fileName="out.txt", format="txt")),
            ],
            edges=[
                Edge(id="e1", source="in1", target="out1"),
                Edge(id="e2", source="in2", target="out1"),
            ]
        )
        _, _, _, start_nodes = parse_workflow_graph(workflow)
        assert set(start_nodes) == {"in1", "in2"}


# ============================================================================
# Node Execution Tests
# ============================================================================

class TestExecuteNode:
    """Tests for execute_node function."""

    def test_unknown_node_type_raises(self):
        """Test that executing a node with unknown type raises ValueError."""
        node = Node(id="n1", type="unknown", position={"x": 0, "y": 0},
                    data={"foo": "bar"})
        with pytest.raises(ValueError, match="Unknown node type"):
            execute_node(node, "exec1", None)

    def test_input_node_returns_file_content(self, tmp_path):
        """Test that an input node reads a file and returns text + metadata."""
        # Create a test file
        test_file = tmp_path / "hello.txt"
        test_file.write_text("Hello, world!")

        node = Node(
            id="in1",
            type="input",
            position={"x": 0, "y": 0},
            data=InputNodeData(fileId=test_file.name, fileName=test_file.name)
        )

        from main import execute_node, UPLOADS_DIR
        import shutil
        # Put the file where the handler expects it
        shutil.copy(test_file, UPLOADS_DIR / test_file.name)

        result = execute_node(node, "exec1", None)
        assert result["text"] == "Hello, world!"
        assert result["metadata"]["filename"] == test_file.name
        assert result["metadata"]["format"] == "txt"

    def test_output_node_writes_file(self, tmp_path, monkeypatch):
        """Test that an output node writes a file to the outputs directory."""
        from main import execute_node, OUTPUTS_DIR

        # Override OUTPUTS_DIR to use tmp_path
        import main
        monkeypatch.setattr(main, "OUTPUTS_DIR", tmp_path)

        node = Node(
            id="out1",
            type="output",
            position={"x": 0, "y": 0},
            data=OutputNodeData(fileName="result.txt", format="txt")
        )

        result = execute_node(node, "exec1", "Output content here")

        assert result["file_name"] == "result.txt"
        output_file = tmp_path / "exec1" / "result.txt"
        assert output_file.exists()
        assert output_file.read_text() == "Output content here"

    def test_output_node_writes_json(self, tmp_path, monkeypatch):
        """Test output node with JSON format wraps string input in object."""
        from main import execute_node, OUTPUTS_DIR

        import main
        monkeypatch.setattr(main, "OUTPUTS_DIR", tmp_path)

        node = Node(
            id="out1",
            type="output",
            position={"x": 0, "y": 0},
            data=OutputNodeData(fileName="result.json", format="json")
        )

        result = execute_node(node, "exec1", "Hello world")
        output_file = tmp_path / "exec1" / "result.json"
        content = output_file.read_text()
        assert '"result"' in content  # Wrapped in {"result": "..."}


# ============================================================================
# Workflow Execution Logic Tests
# ============================================================================

class TestWorkflowExecution:
    """Tests for the workflow execution engine."""

    def test_rule_node_evaluates_true_path(self):
        """Test that a rule node with a true condition returns path='true'."""
        from main import execute_node
        from node_handlers import handle_rule_node

        node = Node(
            id="rule1",
            type="rule",
            position={"x": 0, "y": 0},
            data=RuleNodeData(
                conditions=[RuleCondition(variable="status", operator="==", value="active")],
                logic="AND"
            )
        )

        result = execute_node(node, "exec1", {"status": "active"})
        assert result["result"] is True
        assert result["path"] == "true"

    def test_rule_node_evaluates_false_path(self):
        """Test that a rule node with a false condition returns path='false'."""
        from main import execute_node

        node = Node(
            id="rule1",
            type="rule",
            position={"x": 0, "y": 0},
            data=RuleNodeData(
                conditions=[RuleCondition(variable="status", operator="==", value="active")],
                logic="AND"
            )
        )

        result = execute_node(node, "exec1", {"status": "inactive"})
        assert result["result"] is False
        assert result["path"] == "false"

    def test_rule_node_and_logic(self):
        """Test AND logic: both conditions must be true."""
        from main import execute_node

        node = Node(
            id="rule1",
            type="rule",
            position={"x": 0, "y": 0},
            data=RuleNodeData(
                conditions=[
                    RuleCondition(variable="status", operator="==", value="active"),
                    RuleCondition(variable="score", operator=">=", value="80"),
                ],
                logic="AND"
            )
        )

        # True AND True
        result = execute_node(node, "exec1", {"status": "active", "score": 85})
        assert result["result"] is True

        # True AND False
        result = execute_node(node, "exec1", {"status": "active", "score": 50})
        assert result["result"] is False

    def test_rule_node_or_logic(self):
        """Test OR logic: at least one condition must be true."""
        from main import execute_node

        node = Node(
            id="rule1",
            type="rule",
            position={"x": 0, "y": 0},
            data=RuleNodeData(
                conditions=[
                    RuleCondition(variable="status", operator="==", value="inactive"),
                    RuleCondition(variable="score", operator=">=", value="80"),
                ],
                logic="OR"
            )
        )

        # False OR True
        result = execute_node(node, "exec1", {"status": "inactive", "score": 85})
        assert result["result"] is True

        # True OR False (status matches)
        result = execute_node(node, "exec1", {"status": "inactive", "score": 50})
        assert result["result"] is True

    def test_rule_node_nested_json_path(self):
        """Test rule node resolves dot-notation paths into nested JSON."""
        from main import execute_node

        node = Node(
            id="rule1",
            type="rule",
            position={"x": 0, "y": 0},
            data=RuleNodeData(
                conditions=[RuleCondition(variable="user.age", operator=">=", value="18")],
                logic="AND"
            )
        )

        result = execute_node(node, "exec1", {"user": {"name": "Alice", "age": 25}})
        assert result["result"] is True

        result = execute_node(node, "exec1", {"user": {"name": "Bob", "age": 16}})
        assert result["result"] is False

    def test_rule_node_in_operator(self):
        """Test 'in' operator checks containment in list or string."""
        from main import execute_node

        node = Node(
            id="rule1",
            type="rule",
            position={"x": 0, "y": 0},
            data=RuleNodeData(
                conditions=[RuleCondition(variable="tags", operator="in", value="urgent")],
                logic="AND"
            )
        )

        # "urgent" in list
        result = execute_node(node, "exec1", {"tags": ["important", "urgent", "review"]})
        assert result["result"] is True

        # "urgent" not in list
        result = execute_node(node, "exec1", {"tags": ["important", "review"]})
        assert result["result"] is False

    def test_rule_node_comparison_operators(self):
        """Test numeric comparison operators: >, <, >=, <=."""
        from main import execute_node

        node_gt = Node(
            id="r1", type="rule", position={"x": 0, "y": 0},
            data=RuleNodeData(
                conditions=[RuleCondition(variable="score", operator=">", value="50")],
                logic="AND"
            )
        )
        node_lt = Node(
            id="r2", type="rule", position={"x": 0, "y": 0},
            data=RuleNodeData(
                conditions=[RuleCondition(variable="score", operator="<", value="100")],
                logic="AND"
            )
        )

        assert execute_node(node_gt, "e1", {"score": 75})["result"] is True
        assert execute_node(node_gt, "e2", {"score": 50})["result"] is False
        assert execute_node(node_lt, "e3", {"score": 75})["result"] is True
        assert execute_node(node_lt, "e4", {"score": 100})["result"] is False

    def test_rule_node_no_conditions_defaults_false(self):
        """Test rule node with empty conditions returns False."""
        from main import execute_node

        node = Node(
            id="rule1",
            type="rule",
            position={"x": 0, "y": 0},
            data=RuleNodeData(conditions=[], logic="AND")
        )

        result = execute_node(node, "exec1", {"anything": "here"})
        assert result["result"] is False
        assert result["path"] == "false"