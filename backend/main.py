# main.py
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List, Union, Literal, Tuple
import uuid
from datetime import datetime, timezone
import os
from pathlib import Path
import json
import logging
from dotenv import load_dotenv
import fitz
from anthropic import Anthropic

load_dotenv(override=True)

# Import node handlers
from node_handlers import (
    handle_input_node,
    handle_llm_node,
    handle_output_node,
    handle_rule_node,
    handle_langgraph_node,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("workflow_engine")

app = FastAPI(title="ETL Anything API", version="1.0.0")

# CORS configuration 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Anthropic client.
# Drop ANTHROPIC_API_KEY so the SDK doesn't also send x-api-key alongside the
# bearer token — LiteLLM expects Authorization: Bearer only.
os.environ.pop("ANTHROPIC_API_KEY", None)
anthropic_client = Anthropic(
    base_url=os.getenv("OCTANE_LITELLM"),
    auth_token=os.getenv("OCTANE_API_KEY"),
)

# In-memory execution store
executions: Dict[str, "ExecutionStatus"] = {}
node_results: Dict[str, Dict[str, Any]] = {}


# Pydantic Models for Workflow Nodes
class InputNodeData(BaseModel):
    fileId: str
    fileName: str


class LLMNodeData(BaseModel):
    prompt: str
    model: str
    temperature: Optional[float] = 0.7
    system_prompt: Optional[str] = None  # Optional system-level instructions


class RuleCondition(BaseModel):
    variable: str
    operator: str
    value: str


class RuleNodeData(BaseModel):
    conditions: List[RuleCondition] = []
    logic: Literal["AND", "OR"] = "AND"


class OutputNodeData(BaseModel):
    fileName: str
    format: str


class Node(BaseModel):
    id: str
    type: str  # "input", "llm", "output", "rule", etc. — execute_node validates
    position: Dict[str, float]
    data: Union[InputNodeData, LLMNodeData, OutputNodeData, RuleNodeData, Dict[str, Any]]


class Edge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None  # for rule node branching ('true' or 'false')


class WorkflowDefinition(BaseModel):
    nodes: List[Node]
    edges: List[Edge]


class ExecuteRequest(BaseModel):
    workflow: WorkflowDefinition


class NodeStatus(BaseModel):
    status: str  # pending, processing, completed, failed, skipped
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    output_preview: Optional[str] = None
    error: Optional[str] = None


class ExecutionProgress(BaseModel):
    current_node: Optional[str] = None
    total_nodes: int
    completed_nodes: int


class ExecutionStatus(BaseModel):
    execution_id: str
    status: str  # queued, processing, completed, failed
    progress: ExecutionProgress
    nodes: Dict[str, NodeStatus]
    error: Optional[str] = None
    started_at: str
    completed_at: Optional[str] = None


class ExecuteResponse(BaseModel):
    execution_id: str
    status: str
    message: str


# Create necessary directories on startup
UPLOADS_DIR = Path(os.getenv("UPLOADS_DIR", str(Path(__file__).parent / "uploads")))
OUTPUTS_DIR = Path(os.getenv("OUTPUTS_DIR", str(Path(__file__).parent / "outputs")))
UPLOADS_DIR.mkdir(exist_ok=True)
OUTPUTS_DIR.mkdir(exist_ok=True)

logger.info(f"Using UPLOADS_DIR: {UPLOADS_DIR.absolute()}")
logger.info(f"Using OUTPUTS_DIR: {OUTPUTS_DIR.absolute()}")


# Node Handler Registry
NODE_HANDLERS = {
    "input": handle_input_node,
    "llm": handle_llm_node,
    "output": handle_output_node,
    "rule": handle_rule_node,
}


# Workflow Execution Engine Functions
def parse_workflow_graph(workflow: WorkflowDefinition) -> tuple:
    """
    Parse workflow graph and return node lookup, adjacency list, and start nodes.
    Also validates workflow structure.
    
    Returns: (node_lookup, adjacency_list, start_nodes)
    """
    logger.info("=" * 80)
    logger.info("PARSING WORKFLOW GRAPH")
    logger.info(f"Total nodes: {len(workflow.nodes)}, Total edges: {len(workflow.edges)}")
    
    # Validate workflow has at least one node
    if not workflow.nodes:
        logger.error("Workflow validation failed: No nodes found")
        raise ValueError("Workflow must contain at least one node")
    
    # Build node lookup: {node_id → Node}
    node_lookup = {node.id: node for node in workflow.nodes}
    logger.info(f"Node types: {', '.join([f'{node.id}={node.type}' for node in workflow.nodes])}")
    
    # Build adjacency list: {source_id → [target_ids]}
    adjacency_list: Dict[str, List[str]] = {node.id: [] for node in workflow.nodes}
    incoming_edges: Dict[str, List[Tuple[str, Optional[str]]]] = {node.id: [] for node in workflow.nodes}

    # Validate edges and build adjacency lists
    for edge in workflow.edges:
        if edge.source not in node_lookup:
            logger.error(f"Edge validation failed: source '{edge.source}' not found")
            raise ValueError(f"Edge source '{edge.source}' does not exist in nodes")
        if edge.target not in node_lookup:
            logger.error(f"Edge validation failed: target '{edge.target}' not found")
            raise ValueError(f"Edge target '{edge.target}' does not exist in nodes")

        adjacency_list[edge.source].append(edge.target)
        # Store (source_id, sourceHandle) to support rule node branching
        incoming_edges[edge.target].append((edge.source, edge.sourceHandle))
        logger.info(f"Edge: {edge.source} → {edge.target} (handle={edge.sourceHandle})")
    
    # Find start nodes (nodes with no incoming edges)
    start_nodes = [node_id for node_id, incoming in incoming_edges.items() if not incoming]
    logger.info(f"Start nodes (no incoming edges): {start_nodes}")

    if not start_nodes:
        # Check if the graph is cyclic (every node has at least one incoming edge)
        # vs just being malformed (isolated nodes without edges at all)
        total_incoming = sum(len(incoming) for incoming in incoming_edges.values())
        if total_incoming == len(incoming_edges) and len(incoming_edges) > 1:
            logger.error("Workflow validation failed: Graph contains a cycle")
            raise ValueError(
                "Workflow contains a circular dependency: every node has at least one "
                "incoming edge, so there is no starting point. Break the cycle by "
                "removing one or more edges."
            )
        else:
            logger.error("Workflow validation failed: No start nodes found")
            raise ValueError(
                "Workflow must have at least one start node (a node with no incoming edges). "
                "This may indicate isolated nodes or a disconnected graph."
            )
    
    # Validate input nodes have fileId
    for node in workflow.nodes:
        if node.type == "input":
            if not isinstance(node.data, InputNodeData):
                logger.error(f"Input node '{node.id}' has invalid data type")
                raise ValueError(f"Input node '{node.id}' has invalid data")
            if not node.data.fileId:
                logger.error(f"Input node '{node.id}' missing fileId")
                raise ValueError(f"Input node '{node.id}' must have a fileId")
            logger.info(f"Input node '{node.id}' validated: fileId={node.data.fileId}")
    
    logger.info("Workflow graph parsed successfully")
    logger.info("=" * 80)
    return node_lookup, adjacency_list, incoming_edges, start_nodes


def execute_node(
    node: Node,
    execution_id: str,
    input_data: Optional[Any] = None
) -> Any:
    """
    Execute a single node based on its type.
    Uses the NODE_HANDLERS registry to dispatch to the appropriate handler.
    
    Args:
        node: The node to execute
        execution_id: Current execution ID
        input_data: Input from previous node (if any)
    
    Returns:
        Output data from the node execution
    """
    logger.info(f"[{node.id}] Executing {node.type.upper()} node")
    
    # Look up the handler for this node type
    handler = NODE_HANDLERS.get(node.type)
    
    if not handler:
        logger.error(f"[{node.id}] Unknown node type: {node.type}")
        raise ValueError(f"Unknown node type: {node.type}")
    
    # Prepare context with all dependencies
    # Handlers can use **kwargs to get what they need
    context = {
        "uploads_dir": UPLOADS_DIR,
        "outputs_dir": OUTPUTS_DIR,
        "anthropic_client": anthropic_client,
    }
    
    # Call the handler with node, execution_id, input_data, and context
    return handler(node, execution_id, input_data, **context)


def execute_node_recursive(
    node_id: str,
    node_lookup: Dict[str, Node],
    adjacency_list: Dict[str, List[str]],
    incoming_edges: Dict[str, List[str]],
    execution_id: str,
    results: Dict[str, Any],
    visited: set
) -> None:
    """
    Recursively execute a node and its downstream nodes.

    Args:
        node_id: ID of the node to execute
        node_lookup: Map of node_id to Node
        adjacency_list: Map of node_id to list of downstream node_ids
        incoming_edges: Map of node_id to list of upstream node_ids
        execution_id: Current execution ID
        results: Dictionary to store node results
        visited: Set of already visited nodes
    """
    if node_id in visited:
        logger.debug(f"[{node_id}] Already visited, skipping")
        return

    visited.add(node_id)
    node = node_lookup[node_id]

    logger.info("-" * 60)
    logger.info(f"[{node_id}] Starting node execution ({node.type})")

    # Update node status to processing
    if execution_id in executions:
        executions[execution_id].nodes[node_id].status = "processing"
        executions[execution_id].nodes[node_id].started_at = datetime.now(timezone.utc).isoformat()
        executions[execution_id].progress.current_node = node_id

    try:
        # Get all inputs from upstream nodes
        upstream_ids = incoming_edges.get(node_id, [])
        upstream_results = [results[sid] for sid in upstream_ids if sid in results]

        if upstream_results:
            # Log all sources
            for sid in upstream_ids:
                if sid in results:
                    logger.info(f"[{node_id}] Received input from node: {sid}")

        # Determine what to pass to the node handler
        if node.type == "input":
            # Input nodes don't need upstream data
            input_data = None
        elif len(upstream_results) == 1:
            # Single upstream: pass the result directly (backward compatible)
            input_data = upstream_results[0]
        elif len(upstream_results) > 1:
            # Multiple upstreams (DAG merge): pass list so handler can decide
            logger.info(f"[{node_id}] Multiple upstream results ({len(upstream_results)}), passing as list")
            input_data = upstream_results
        else:
            # No upstream results yet
            input_data = None
            if node.type != "input":
                logger.warning(f"[{node_id}] No input data found (expected for {node.type} node)")

        # Execute the node
        output = execute_node(node, execution_id, input_data)

        # Store result
        results[node_id] = output

        # Determine which downstream path to follow for rule nodes
        # Rule nodes return path='true' or path='false' based on condition evaluation
        downstream_filter: Optional[str] = None
        if node.type == "rule" and isinstance(output, dict) and "path" in output:
            downstream_filter = output["path"]
            logger.info(f"[{node_id}] Rule node branching: path='{downstream_filter}'")

        logger.info(f"[{node_id}] Node execution completed successfully")
        
        # Update node status to completed
        if execution_id in executions:
            executions[execution_id].nodes[node_id].status = "completed"
            executions[execution_id].nodes[node_id].completed_at = datetime.now(timezone.utc).isoformat()
            
            # Store output preview (first 200 chars)
            output_str = str(output)
            if isinstance(output, dict) and "text" in output:
                output_str = output["text"]
            executions[execution_id].nodes[node_id].output_preview = output_str[:200]
            
            executions[execution_id].progress.completed_nodes += 1
            logger.info(f"Progress: {executions[execution_id].progress.completed_nodes}/{executions[execution_id].progress.total_nodes} nodes completed")
        
        # Execute downstream nodes
        downstream_nodes = adjacency_list[node_id]
        if downstream_nodes:
            logger.info(f"[{node_id}] Processing {len(downstream_nodes)} downstream node(s): {downstream_nodes}")

            # For rule nodes, filter downstream to only follow the matching path
            if downstream_filter is not None:
                # incoming_edges[target] = [(source_id, sourceHandle), ...]
                # Filter: only include target if there's an incoming edge where sourceHandle matches downstream_filter
                filtered: List[str] = []
                for dn_id in downstream_nodes:
                    # Check if there's an edge from current node to dn_id with matching sourceHandle
                    for src_id, handle in incoming_edges.get(dn_id, []):
                        if src_id == node_id and handle == downstream_filter:
                            filtered.append(dn_id)
                            break
                if filtered:
                    logger.info(f"[{node_id}] Branching: following path '{downstream_filter}' to nodes: {filtered}")
                    downstream_nodes = filtered
                else:
                    logger.info(f"[{node_id}] Branching: no downstream nodes for path '{downstream_filter}'")
                    downstream_nodes = []

            for downstream_id in downstream_nodes:
                execute_node_recursive(
                    downstream_id,
                    node_lookup,
                    adjacency_list,
                    incoming_edges,
                    execution_id,
                    results,
                    visited
                )
        else:
            logger.info(f"[{node_id}] No downstream nodes (end of workflow path)")
    
    except Exception as e:
        logger.error(f"[{node_id}] Node execution failed: {str(e)}", exc_info=True)
        
        # Mark node as failed
        if execution_id in executions:
            executions[execution_id].nodes[node_id].status = "failed"
            executions[execution_id].nodes[node_id].error = str(e)
            executions[execution_id].nodes[node_id].completed_at = datetime.now(timezone.utc).isoformat()
        
        # Mark downstream nodes as skipped
        downstream_nodes = adjacency_list[node_id]
        if downstream_nodes:
            logger.warning(f"[{node_id}] Marking {len(downstream_nodes)} downstream node(s) as skipped: {downstream_nodes}")
            for downstream_id in downstream_nodes:
                if execution_id in executions and downstream_id in executions[execution_id].nodes:
                    executions[execution_id].nodes[downstream_id].status = "skipped"
                    logger.info(f"[{downstream_id}] Marked as skipped due to upstream failure")
        
        raise


async def execute_workflow_engine(execution_id: str, workflow: WorkflowDefinition):
    """
    Background task to execute a workflow.
    
    Args:
        execution_id: Unique ID for this execution
        workflow: The workflow definition to execute
    """
    logger.info("")
    logger.info("=" * 80)
    logger.info(f"WORKFLOW EXECUTION STARTED")
    logger.info(f"Execution ID: {execution_id}")
    logger.info("=" * 80)
    
    try:
        # Update status to processing
        if execution_id in executions:
            executions[execution_id].status = "processing"
            logger.info(f"Status updated: queued → processing")
        
        # Parse workflow graph
        node_lookup, adjacency_list, incoming_edges, start_nodes = parse_workflow_graph(workflow)
        
        # Initialize results storage
        results: Dict[str, Any] = {}
        visited: set = set()
        
        logger.info("")
        logger.info("EXECUTING WORKFLOW NODES")
        logger.info(f"Starting execution from {len(start_nodes)} start node(s)")
        logger.info("=" * 80)
        
        # Execute workflow starting from start nodes
        for idx, start_node_id in enumerate(start_nodes, 1):
            logger.info(f"Executing start node {idx}/{len(start_nodes)}: {start_node_id}")
            execute_node_recursive(
                start_node_id,
                node_lookup,
                adjacency_list,
                incoming_edges,
                execution_id,
                results,
                visited
            )
        
        # Store results
        if execution_id not in node_results:
            node_results[execution_id] = {}
        node_results[execution_id] = results
        
        logger.info("=" * 80)
        logger.info(f"WORKFLOW EXECUTION COMPLETED SUCCESSFULLY")
        logger.info(f"Execution ID: {execution_id}")
        logger.info(f"Total nodes executed: {len(results)}")
        logger.info("=" * 80)
        
        # Mark execution as completed
        if execution_id in executions:
            executions[execution_id].status = "completed"
            executions[execution_id].completed_at = datetime.now(timezone.utc).isoformat()
            logger.info(f"Status updated: processing → completed")
    
    except Exception as e:
        logger.error("=" * 80)
        logger.error(f"WORKFLOW EXECUTION FAILED")
        logger.error(f"Execution ID: {execution_id}")
        logger.error(f"Error: {str(e)}")
        logger.error("=" * 80, exc_info=True)
        
        # Mark execution as failed
        if execution_id in executions:
            executions[execution_id].status = "failed"
            executions[execution_id].error = str(e)
            executions[execution_id].completed_at = datetime.now(timezone.utc).isoformat()
            logger.info(f"Status updated: processing → failed")


# API Endpoints
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "ETL Anything API",
        "status": "running",
        "version": "1.0.0"
    }


@app.post("/api/workflows/execute", response_model=ExecuteResponse)
async def execute_workflow(
    request: ExecuteRequest,
    background_tasks: BackgroundTasks
):
    """
    Execute a workflow definition.
    Returns an execution_id for status polling.
    """
    logger.info("=" * 80)
    logger.info("POST /api/workflows/execute - Request received")
    logger.info(f"Workflow: {len(request.workflow.nodes)} nodes, {len(request.workflow.edges)} edges")
    
    # Validate API key
    if not os.getenv("OCTANE_API_KEY"):
        logger.error("OCTANE_API_KEY not configured")
        raise HTTPException(
            status_code=500,
            detail="OCTANE_API_KEY not configured in environment"
        )
    
    # Validate workflow
    try:
        parse_workflow_graph(request.workflow)
    except ValueError as e:
        logger.error(f"Workflow validation failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    
    # Generate execution ID
    execution_id = str(uuid.uuid4())
    logger.info(f"Generated execution ID: {execution_id}")
    
    # Initialize execution status
    node_statuses = {}
    for node in request.workflow.nodes:
        node_statuses[node.id] = NodeStatus(status="pending")
    
    executions[execution_id] = ExecutionStatus(
        execution_id=execution_id,
        status="queued",
        progress=ExecutionProgress(
            current_node=None,
            total_nodes=len(request.workflow.nodes),
            completed_nodes=0
        ),
        nodes=node_statuses,
        started_at=datetime.now(timezone.utc).isoformat()
    )
    
    logger.info(f"Execution queued, starting background task...")
    
    # Queue background task
    background_tasks.add_task(
        execute_workflow_engine,
        execution_id,
        request.workflow
    )
    
    logger.info(f"Response: execution_id={execution_id}, status=queued")
    logger.info("=" * 80)
    
    return ExecuteResponse(
        execution_id=execution_id,
        status="queued",
        message="Workflow execution started"
    )


@app.get("/api/executions/{execution_id}/status", response_model=ExecutionStatus)
async def get_execution_status(execution_id: str):
    """
    Get the current status of a workflow execution.
    """
    logger.debug(f"GET /api/executions/{execution_id}/status - Request received")
    
    if execution_id not in executions:
        logger.warning(f"Execution not found: {execution_id}")
        raise HTTPException(status_code=404, detail="Execution not found")
    
    status = executions[execution_id].status
    logger.debug(f"Execution {execution_id} status: {status}")
    
    return executions[execution_id]


@app.get("/api/executions/{execution_id}/download")
async def download_execution_output(execution_id: str):
    """
    Download the output file from a completed workflow execution.
    """
    logger.info("=" * 80)
    logger.info(f"GET /api/executions/{execution_id}/download - Request received")
    
    # Check if execution exists
    if execution_id not in executions:
        logger.error(f"Execution not found: {execution_id}")
        raise HTTPException(status_code=404, detail="Execution not found")
    
    # Check if execution is completed
    execution = executions[execution_id]
    logger.info(f"Execution status: {execution.status}")
    
    if execution.status != "completed":
        logger.warning(f"Execution not completed (status: {execution.status})")
        raise HTTPException(
            status_code=400,
            detail=f"Execution not completed yet. Current status: {execution.status}"
        )
    
    # Find output files in the execution directory
    output_dir = OUTPUTS_DIR / execution_id
    logger.info(f"Looking for output files in: {output_dir}")
    
    if not output_dir.exists():
        logger.error(f"Output directory not found: {output_dir}")
        raise HTTPException(status_code=404, detail="Output directory not found")
    
    # Get the first output file (as per spec, single output)
    output_files = list(output_dir.iterdir())
    if not output_files:
        logger.error(f"No output files found in: {output_dir}")
        raise HTTPException(status_code=404, detail="No output files found")
    
    output_file = output_files[0]
    logger.info(f"Found output file: {output_file.name} ({output_file.stat().st_size} bytes)")
    
    # Determine content type based on file extension
    content_type_map = {
        ".txt": "text/plain",
        ".json": "application/json",
        ".md": "text/markdown",
        ".pdf": "application/pdf",
        ".csv": "text/csv"
    }
    content_type = content_type_map.get(output_file.suffix, "application/octet-stream")
    logger.info(f"Content type: {content_type}")
    logger.info(f"Streaming file to client...")
    logger.info("=" * 80)
    
    # Return file response with appropriate headers
    return FileResponse(
        path=str(output_file),
        media_type=content_type,
        filename=output_file.name,
        headers={
            "Content-Disposition": f'attachment; filename="{output_file.name}"'
        }
    )


# ==============================================================================
# Workflow Save / Load Endpoints
# ==============================================================================

WORKFLOWS_DIR = Path(os.getenv("WORKFLOWS_DIR", str(Path(__file__).parent / "workflows")))
WORKFLOWS_DIR.mkdir(exist_ok=True)


class SaveWorkflowRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    workflow: WorkflowDefinition


class WorkflowMetadata(BaseModel):
    id: str
    name: str
    description: Optional[str]
    created_at: str
    updated_at: str
    node_count: int
    edge_count: int


class WorkflowListResponse(BaseModel):
    workflows: List[WorkflowMetadata]


@app.get("/api/workflows", response_model=WorkflowListResponse)
async def list_workflows():
    """List all saved workflows."""
    workflows = []
    for wf_dir in WORKFLOWS_DIR.iterdir():
        if not wf_dir.is_dir():
            continue
        meta_path = wf_dir / "metadata.json"
        if not meta_path.exists():
            continue
        try:
            meta = json.loads(meta_path.read_text())
            workflows.append(WorkflowMetadata(**meta))
        except Exception:
            continue
    workflows.sort(key=lambda w: w.updated_at, reverse=True)
    return WorkflowListResponse(workflows=workflows)


@app.post("/api/workflows", response_model=WorkflowMetadata)
async def save_workflow(request: SaveWorkflowRequest):
    """Save a workflow definition to disk."""
    workflow_id = str(uuid.uuid4())
    wf_dir = WORKFLOWS_DIR / workflow_id
    wf_dir.mkdir(exist_ok=True)

    now = datetime.now(timezone.utc).isoformat()
    metadata = {
        "id": workflow_id,
        "name": request.name,
        "description": request.description,
        "created_at": now,
        "updated_at": now,
        "node_count": len(request.workflow.nodes),
        "edge_count": len(request.workflow.edges),
    }
    (wf_dir / "metadata.json").write_text(json.dumps(metadata, indent=2))
    (wf_dir / "workflow.json").write_text(request.workflow.model_dump_json(indent=2))

    logger.info(f"Saved workflow '{request.name}' (id={workflow_id})")
    return WorkflowMetadata(**metadata)


@app.get("/api/workflows/{workflow_id}", response_model=WorkflowDefinition)
async def load_workflow(workflow_id: str):
    """Load a saved workflow definition."""
    wf_dir = WORKFLOWS_DIR / workflow_id
    workflow_path = wf_dir / "workflow.json"
    if not workflow_path.exists():
        raise HTTPException(status_code=404, detail="Workflow not found")
    data = json.loads(workflow_path.read_text())
    return WorkflowDefinition(**data)


@app.delete("/api/workflows/{workflow_id}")
async def delete_workflow(workflow_id: str):
    """Delete a saved workflow."""
    wf_dir = WORKFLOWS_DIR / workflow_id
    if not wf_dir.exists():
        raise HTTPException(status_code=404, detail="Workflow not found")
    import shutil
    shutil.rmtree(wf_dir)
    logger.info(f"Deleted workflow {workflow_id}")
    return {"message": "Workflow deleted"}


@app.delete("/api/executions/{execution_id}")
async def cancel_execution(execution_id: str):
    """
    Cancel a running workflow execution.
    Sets status to 'cancelled' and marks remaining nodes as skipped.
    """
    logger.info(f"DELETE /api/executions/{execution_id} - Request received")

    if execution_id not in executions:
        logger.warning(f"Execution not found: {execution_id}")
        raise HTTPException(status_code=404, detail="Execution not found")

    execution = executions[execution_id]

    if execution.status in ("completed", "failed", "cancelled"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel execution with status: {execution.status}"
        )

    # Mark as cancelled
    execution.status = "cancelled"
    execution.completed_at = datetime.now().isoformat()

    # Mark any processing nodes as cancelled
    for node_id, node_status in execution.nodes.items():
        if node_status.status == "processing":
            node_status.status = "cancelled"
            node_status.completed_at = datetime.now().isoformat()
        elif node_status.status == "pending":
            node_status.status = "skipped"

    logger.info(f"Execution {execution_id} cancelled")
    return {"message": f"Execution {execution_id} cancelled", "status": "cancelled"}


# ==============================================================================
# File Listing Endpoints
# ==============================================================================

class FileMetadata(BaseModel):
    id: str
    name: str
    size: int
    uploaded_at: str


class FileListResponse(BaseModel):
    files: List[FileMetadata]


@app.get("/api/files", response_model=FileListResponse)
async def list_files():
    """List all uploaded files."""
    if not UPLOADS_DIR.exists():
        raise HTTPException(status_code=404, detail="Uploads directory not found")
    
    files = []
    for file_path in UPLOADS_DIR.iterdir():
        if not file_path.is_file():
            continue
        stat = file_path.stat()
        files.append(FileMetadata(
            id=file_path.name,
            name=file_path.name,
            size=stat.st_size,
            uploaded_at=datetime.fromtimestamp(stat.st_mtime).isoformat()
        ))
    files.sort(key=lambda f: f.uploaded_at, reverse=True)
    return FileListResponse(files=files)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)