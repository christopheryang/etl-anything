"""
Prompt Builder for Workflow Generation

Constructs the system prompt sent to the LLM when generating or modifying
workflows from natural language descriptions.
"""

import json
from typing import Any, Optional


# Node type catalog — must stay in sync with main.py models and nodeConfig.ts
NODE_CATALOG = {
    "input": {
        "frontend_type": "input",
        "backend_type": "input",
        "label": "Input Node",
        "description": "Reads data from an uploaded file",
        "data_fields": {
            "fileId": "string — ID of the uploaded file (usually the filename)",
            "fileName": "string — Name of the uploaded file",
        },
    },
    "reasoning": {
        "frontend_type": "reasoning",
        "backend_type": "llm",
        "label": "Reasoning Node",
        "description": "Processes data using an LLM with a custom prompt",
        "data_fields": {
            "prompt": "string — The instruction sent to the LLM (can reference input data)",
            "model": "string — One of: haiku-4.5, sonnet-4.7, opus-4.7, qwen/qwen3.5-397b-a17b, minimax/minimax-m2.7, thudm/glm-4.7",
            "temperature": "float — 0.0 to 1.0, default 0.7",
            "system_prompt": "string — Optional system-level instruction for the LLM",
        },
    },
    "rule": {
        "frontend_type": "rule",
        "backend_type": "rule",
        "label": "Rule Node",
        "description": "Branches workflow based on conditions (true/false handles)",
        "data_fields": {
            "conditions": 'array of {variable: string, operator: string, value: string} — e.g. [{"variable": "status", "operator": "equals", "value": "active"}]',
            "logic": 'string — "AND" or "OR", default "AND"',
        },
        "handles": {
            "true": "Output handle for when all/any conditions are met",
            "false": "Output handle for when conditions are NOT met",
        },
    },
    "output": {
        "frontend_type": "output",
        "backend_type": "output",
        "label": "Output Node",
        "description": "Exports data to a file",
        "data_fields": {
            "fileName": "string — Output filename (e.g. result.csv)",
            "format": 'string — One of: "txt", "json", "md", "csv"',
        },
    },
}

EDGE_SCHEMA = {
    "id": "string — Unique edge ID (format: e-{source}-{target})",
    "source": "string — Source node ID",
    "target": "string — Target node ID",
    "sourceHandle": 'string — Optional, only for rule nodes: "true" or "false"',
}

NODE_SCHEMA = {
    "id": "string — Unique node ID (format: {type}_{timestamp})",
    "type": 'string — One of: "input", "reasoning", "rule", "output"',
    "position": {"x": "number — horizontal position (spread ~300px apart)", "y": "number — vertical position (~200 center)"},
    "data": "object — Node-type-specific fields (see NODE_CATALOG)",
}


def build_workflow_generation_prompt(
    available_files: list[str],
    current_workflow: Optional[dict[str, Any]] = None,
) -> str:
    """
    Build the system prompt for workflow generation.

    Args:
        available_files: List of filenames in the uploads directory.
        current_workflow: Current workflow state (nodes + edges) if modifying
                         an existing workflow. None if starting from scratch.

    Returns:
        The complete system prompt string.
    """
    files_section = ""
    if available_files:
        files_list = "\n".join(f"  - {f}" for f in available_files)
        files_section = f"""
Available uploaded files:
{files_list}

When creating an input node, set fileId and fileName to one of the above filenames.
"""
    else:
        files_section = """
No files have been uploaded yet. If the user wants to process a file, create an input node
with a placeholder fileName and inform them they need to upload the file first.
"""

    current_workflow_section = ""
    if current_workflow:
        workflow_json = json.dumps(current_workflow, indent=2)
        current_workflow_section = f"""
The user already has a workflow on the canvas. Here is the current state:
```json
{workflow_json}
```

You should MODIFY this workflow based on the user's new instruction. Keep existing nodes
that are still relevant, add new ones as needed, and remove or change ones that conflict.
Generate a COMPLETE workflow (all nodes and edges), not just the diff.
"""

    node_catalog_json = json.dumps(NODE_CATALOG, indent=2)
    edge_schema_json = json.dumps(EDGE_SCHEMA, indent=2)
    node_schema_json = json.dumps(NODE_SCHEMA, indent=2)

    return f"""You are an ETL workflow designer. You create visual data processing workflows based on user descriptions.

## Node Types Available

{node_catalog_json}

## Node JSON Schema

{node_schema_json}

## Edge JSON Schema

{edge_schema_json}

{files_section}
{current_workflow_section}
## Important Rules

1. Every workflow MUST have at least one input node and one output node.
2. Nodes must be connected in a logical DAG (no cycles).
3. Position nodes horizontally spread out (x spacing ~300px), starting at x=100, y=200.
4. Use "reasoning" type (NOT "llm") for the frontend node type field. The backend maps "reasoning" to "llm" automatically.
5. For rule nodes with branching, use sourceHandle "true" or "false" on the edges.
6. Use descriptive labels on nodes (e.g. "Filter Active Employees", not "Rule Node").
7. When the user wants CSV output, set format to "csv" and fileName to something descriptive.
8. Prefer "qwen/qwen3.5-397b-a17b" as the default model for reasoning nodes unless the user specifies otherwise.
9. Set temperature to 0.3 for data extraction tasks, 0.7 for creative tasks.

## Output Format

You MUST respond with valid JSON only — no markdown, no code blocks, no explanation outside the JSON.

The JSON must have this exact structure:
{{
  "explanation": "A clear, concise explanation of what you generated or changed and why. Written in plain English for the user to read.",
  "nodes": [... array of node objects ...],
  "edges": [... array of edge objects ...]
}}

The explanation should describe:
- What nodes you created and their purpose
- How they are connected
- What data flows through each connection
- Any assumptions you made

If the user's request is unclear, make reasonable assumptions and explain them in the explanation.
"""


def build_user_prompt(user_message: str) -> str:
    """Wrap the user's message for the chat completion API."""
    return user_message
