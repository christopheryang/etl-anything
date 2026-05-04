# node_handlers.py
"""
Individual node execution handlers.
Each function handles a specific node type.
"""
from typing import Any, Optional, Dict
from pathlib import Path
import logging
import json
import fitz
from anthropic import Anthropic

logger = logging.getLogger("workflow_engine")


def handle_input_node(
    node: Any,
    execution_id: str,
    input_data: Optional[Any],
    uploads_dir: Path,
    **kwargs
) -> Dict[str, Any]:
    """
    Handle INPUT node: Read and extract text from uploaded files.
    
    Args:
        node: The input node
        execution_id: Current execution ID
        input_data: Input from previous node (unused for input nodes)
        uploads_dir: Directory where uploaded files are stored
        **kwargs: Additional context (unused)
    
    Returns:
        Dict with 'text' and 'metadata' keys
    """
    data = node.data
    file_path = uploads_dir / data.fileId
    logger.info(f"[{node.id}] Reading file: {file_path}")
    
    if not file_path.exists():
        logger.error(f"[{node.id}] File not found: {file_path}")
        raise FileNotFoundError(f"Input file not found: {data.fileId}")
    
    # Extract text from PDF using PyMuPDF
    pdf_doc = None
    try:
        pdf_doc = fitz.open(str(file_path))
        num_pages = pdf_doc.page_count
        logger.info(f"[{node.id}] PDF opened successfully: {num_pages} pages")
        
        pdf_text = ""
        for page_num in range(num_pages):
            page = pdf_doc.load_page(page_num)
            pdf_text += page.get_text()
            logger.info(f"[{node.id}] Extracted text from page {page_num + 1}/{num_pages}")
        
        if not pdf_text or pdf_text.strip() == "":
            logger.error(f"[{node.id}] No text could be extracted from PDF")
            raise ValueError("Could not extract text from PDF")
        
        logger.info(f"[{node.id}] Successfully extracted {len(pdf_text)} characters from PDF")
        
        return {
            "text": pdf_text,
            "metadata": {
                "pages": num_pages,
                "length": len(pdf_text),
                "filename": data.fileName
            }
        }
    finally:
        if pdf_doc:
            pdf_doc.close()
            logger.info(f"[{node.id}] PDF document closed")


def handle_llm_node(
    node: Any,
    execution_id: str,
    input_data: Optional[Any],
    anthropic_client: Anthropic,
    **kwargs
) -> str:
    """
    Handle LLM node: Process text using Claude AI.
    
    Args:
        node: The LLM node
        execution_id: Current execution ID
        input_data: Input text/data from previous node
        anthropic_client: Initialized Anthropic client
        **kwargs: Additional context (unused)
    
    Returns:
        Processed text string
    """
    data = node.data
    
    if not input_data:
        logger.error(f"[{node.id}] No input data provided")
        raise ValueError(f"LLM node {node.id} requires input from previous node")
    
    # Extract text from input
    input_text = ""
    if isinstance(input_data, dict) and "text" in input_data:
        input_text = input_data["text"]
    elif isinstance(input_data, str):
        input_text = input_data
    else:
        input_text = str(input_data)
    
    logger.info(f"[{node.id}] Input text length: {len(input_text)} characters")
    logger.info(f"[{node.id}] Prompt: {data.prompt[:100]}{'...' if len(data.prompt) > 100 else ''}")
    
    # Build prompt
    full_prompt = f"{data.prompt}\n\n{input_text}"
    
    # Map model names to Anthropic model identifiers
    model_map = {
        "claude-haiku-4-5": "claude-haiku-4-5",
    }
    anthropic_model = model_map.get(data.model, "claude-haiku-4-5")
    logger.info(f"[{node.id}] Using model: {anthropic_model} (requested: {data.model})")
    logger.info(f"[{node.id}] Temperature: {data.temperature or 0.7}")
    logger.info(f"[{node.id}] Calling Anthropic API...")
    
    # Call Anthropic API
    message = anthropic_client.messages.create(
        model=anthropic_model,
        max_tokens=4096,
        temperature=data.temperature or 0.7,
        messages=[
            {
                "role": "user",
                "content": full_prompt,
            }
        ],
    )
    
    logger.info(f"[{node.id}] API call successful")
    
    # Extract response text
    response_text = ""
    if message.content and len(message.content) > 0:
        if message.content[0].type == "text":
            response_text = message.content[0].text
    
    logger.info(f"[{node.id}] Response length: {len(response_text)} characters")
    logger.info(f"[{node.id}] Response preview: {response_text[:150]}{'...' if len(response_text) > 150 else ''}")
    
    return response_text


def handle_output_node(
    node: Any,
    execution_id: str,
    input_data: Optional[Any],
    outputs_dir: Path,
    **kwargs
) -> Dict[str, str]:
    """
    Handle OUTPUT node: Write results to file.
    
    Args:
        node: The output node
        execution_id: Current execution ID
        input_data: Data to write from previous node
        outputs_dir: Directory where output files are stored
        **kwargs: Additional context (unused)
    
    Returns:
        Dict with 'file_path' and 'file_name' keys
    """
    data = node.data
    
    if not input_data:
        logger.error(f"[{node.id}] No input data provided")
        raise ValueError(f"Output node {node.id} requires input from previous node")
    
    # Create execution output directory
    output_dir = outputs_dir / execution_id
    output_dir.mkdir(exist_ok=True)
    logger.info(f"[{node.id}] Output directory: {output_dir}")
    
    output_path = output_dir / data.fileName
    logger.info(f"[{node.id}] Writing to file: {data.fileName} (format: {data.format})")
    
    # Write output based on format
    if data.format == "json":
        with open(output_path, "w") as f:
            if isinstance(input_data, str):
                json.dump({"result": input_data}, f, indent=2)
            else:
                json.dump(input_data, f, indent=2)
        logger.info(f"[{node.id}] Wrote JSON output")
    else:  # txt, md, or other text formats
        with open(output_path, "w") as f:
            if isinstance(input_data, str):
                f.write(input_data)
            else:
                f.write(str(input_data))
        logger.info(f"[{node.id}] Wrote text output")
    
    logger.info(f"[{node.id}] File saved successfully: {output_path}")
    
    return {
        "file_path": str(output_path),
        "file_name": data.fileName
    }


# Placeholder for langgraph node
def handle_langgraph_node(
    node: Any,
    execution_id: str,
    input_data: Optional[Any],
    **kwargs
) -> Any:
    """
    Handle LANGGRAPH node: Execute LangGraph workflow.
    
    Args:
        node: The LangGraph node
        execution_id: Current execution ID
        input_data: Input from previous node
        **kwargs: Additional context
    
    Returns:
        Output from LangGraph execution
    """
    # TODO: Implement LangGraph integration
    # Example structure:
    # 1. Get LangGraph config from node.data
    # 2. Build LangGraph graph
    # 3. Execute with input_data
    # 4. Return results
    
    logger.info(f"[{node.id}] LangGraph node execution (not yet implemented)")
    raise NotImplementedError("LangGraph node handler not yet implemented")

