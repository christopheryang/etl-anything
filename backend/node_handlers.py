# node_handlers.py
"""
Individual node execution handlers.
Each function handles a specific node type.
"""
from typing import Any, Optional, Dict, List
from pathlib import Path
import logging
import json
import csv
import time
import httpx
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

    Supports: .pdf, .txt, .md, .csv, .json

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

    ext = file_path.suffix.lower()

    # PDF extraction via PyMuPDF
    if ext == ".pdf":
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
                    "filename": data.fileName,
                    "format": "pdf"
                }
            }
        finally:
            if pdf_doc:
                pdf_doc.close()
                logger.info(f"[{node.id}] PDF document closed")

    # Plain text (.txt) and Markdown (.md)
    elif ext in (".txt", ".md"):
        text = file_path.read_text(encoding="utf-8")
        if not text or text.strip() == "":
            logger.error(f"[{node.id}] File is empty: {file_path}")
            raise ValueError(f"Could not read content from {ext} file")

        logger.info(f"[{node.id}] Read {len(text)} characters from {ext} file")
        return {
            "text": text,
            "metadata": {
                "length": len(text),
                "filename": data.fileName,
                "format": ext.lstrip(".")
            }
        }

    # JSON files - extract as formatted text
    elif ext == ".json":
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                json_data = json.load(f)
            text = json.dumps(json_data, indent=2)
            logger.info(f"[{node.id}] Read JSON with {len(text)} characters")
            return {
                "text": text,
                "metadata": {
                    "length": len(text),
                    "filename": data.fileName,
                    "format": "json"
                }
            }
        except json.JSONDecodeError as e:
            logger.error(f"[{node.id}] Invalid JSON file: {e}")
            raise ValueError(f"Invalid JSON file: {e}")

    # CSV files - convert to readable text
    elif ext == ".csv":
        try:
            with open(file_path, "r", encoding="utf-8", newline="") as f:
                reader = csv.reader(f)
                rows = list(reader)

            if not rows:
                logger.error(f"[{node.id}] CSV file is empty: {file_path}")
                raise ValueError("CSV file is empty")

            # Convert CSV to a readable text table
            lines = []
            for row in rows:
                lines.append(" | ".join(str(cell) for cell in row))
            text = "\n".join(lines)

            logger.info(f"[{node.id}] Read CSV with {len(rows)} rows, {len(text)} chars")
            return {
                "text": text,
                "metadata": {
                    "rows": len(rows),
                    "length": len(text),
                    "filename": data.fileName,
                    "format": "csv"
                }
            }
        except Exception as e:
            logger.error(f"[{node.id}] Failed to read CSV: {e}")
            raise ValueError(f"Failed to read CSV file: {e}")

    else:
        logger.error(f"[{node.id}] Unsupported file format: {ext}")
        raise ValueError(f"Unsupported file format: {ext}. Supported: .pdf, .txt, .md, .csv, .json")


# Model family fallback chain: try models in order until one succeeds.
# Key = canonical model name, Value = ordered list of models to try.
MODEL_FALLBACK_CHAIN: Dict[str, List[str]] = {
    # Haiku family
    "claude-haiku-4-5": ["claude-haiku-4-5", "claude-haiku-3-5", "claude-haiku-3"],
    # Sonnet family
    "claude-sonnet-4-7": ["claude-sonnet-4-7", "claude-sonnet-4", "claude-sonnet-3-5", "claude-haiku-4-5"],
    # Opus family
    "claude-opus-4-7": ["claude-opus-4-7", "claude-opus-4", "claude-sonnet-4-7", "claude-haiku-4-5"],
    # Legacy / direct names
    "claude-3-5-sonnet": ["claude-3-5-sonnet", "claude-3-haiku", "claude-haiku-4-5"],
    "claude-3-haiku": ["claude-3-haiku", "claude-haiku-4-5"],
}


def _is_timeout_error(exc: Exception) -> bool:
    """Return True if the exception is a timeout-related error."""
    name = type(exc).__name__.lower()
    msg = str(exc).lower()
    return (
        "timeout" in name
        or "timed out" in msg
        or isinstance(exc, httpx.TimeoutException)
        or isinstance(exc, httpx.ReadTimeout)
    )


def handle_llm_node(
    node: Any,
    execution_id: str,
    input_data: Optional[Any],
    anthropic_client: Anthropic,
    **kwargs
) -> str:
    """
    Handle LLM node: Process text using Claude AI with automatic timeout retry.

    On timeout, automatically tries fallback models from the same family
    (e.g., haiku-3 -> haiku-4-5) before giving up.

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
    if isinstance(input_data, dict) and "text" in input_data:
        input_text = input_data["text"]
    elif isinstance(input_data, str):
        input_text = input_data
    elif isinstance(input_data, list):
        # DAG merge: concatenate texts from multiple upstream nodes
        input_text = "\n\n---\n\n".join(
            item["text"] if isinstance(item, dict) and "text" in item else str(item)
            for item in input_data
        )
    else:
        input_text = str(input_data)

    logger.info(f"[{node.id}] Input text length: {len(input_text)} characters")
    logger.info(f"[{node.id}] Prompt: {data.prompt[:100]}{'...' if len(data.prompt) > 100 else ''}")

    # Build prompt
    full_prompt = f"{data.prompt}\n\n{input_text}"

    # Determine candidate models (primary + fallbacks)
    requested = data.model or "claude-haiku-4-5"
    candidates: List[str] = []

    # Normalize to a known base key
    found_key = None
    for key in MODEL_FALLBACK_CHAIN:
        if requested.startswith(key) or key.startswith(requested):
            found_key = key
            break

    if found_key:
        candidates = MODEL_FALLBACK_CHAIN[found_key]
    else:
        # Unknown model: try as-is, then fall back to haiku
        candidates = [requested, "claude-haiku-4-5"]

    # Deduplicate while preserving order
    seen = set()
    unique_candidates = []
    for m in candidates:
        if m not in seen:
            seen.add(m)
            unique_candidates.append(m)

    # Remove duplicates of the requested model that may already be in the chain
    if requested in unique_candidates:
        # Move requested to front
        unique_candidates.remove(requested)
        unique_candidates.insert(0, requested)

    logger.info(f"[{node.id}] Model candidates (in order): {unique_candidates}")

    # Build messages list with optional system prompt
    messages: List[Dict[str, str]] = []
    if data.system_prompt:
        messages.append({"role": "system", "content": data.system_prompt})
    messages.append({"role": "user", "content": full_prompt})

    last_error: Optional[Exception] = None
    for attempt_idx, model in enumerate(unique_candidates):
        backoff = 2 ** attempt_idx  # 1s, 2s, 4s, ...
        try:
            logger.info(
                f"[{node.id}] Calling Anthropic API (attempt {attempt_idx + 1}/{len(unique_candidates)}) "
                f"with model={model}..."
            )

            message = anthropic_client.messages.create(
                model=model,
                max_tokens=4096,
                temperature=data.temperature if data.temperature is not None else 0.7,
                messages=messages,
            )

            logger.info(f"[{node.id}] API call successful (model={model})")

            # Extract response text
            response_text = ""
            if message.content and len(message.content) > 0:
                if message.content[0].type == "text":
                    response_text = message.content[0].text

            logger.info(f"[{node.id}] Response length: {len(response_text)} characters")
            logger.info(
                f"[{node.id}] Response preview: {response_text[:150]}"
                f"{'...' if len(response_text) > 150 else ''}"
            )
            return response_text

        except Exception as exc:
            last_error = exc
            if _is_timeout_error(exc):
                logger.warning(
                    f"[{node.id}] Timeout on model={model} (attempt {attempt_idx + 1}/"
                    f"{len(unique_candidates)}). Retrying in {backoff}s..."
                )
                time.sleep(backoff)
                continue
            else:
                # Non-timeout error: don't retry with fallback models, raise immediately
                logger.error(f"[{node.id}] Non-timeout error: {exc}", exc_info=True)
                raise

    # All models timed out
    logger.error(f"[{node.id}] All {len(unique_candidates)} models timed out")
    raise RuntimeError(
        f"LLM node {node.id} failed: all models timed out ({unique_candidates}). "
        f"Last error: {last_error}"
    ) from last_error


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


def handle_rule_node(
    node: Any,
    execution_id: str,
    input_data: Optional[Any],
    **kwargs
) -> Dict[str, Any]:
    """
    Handle RULE node: Evaluate boolean conditions against input data.

    Supports AND/OR logic across multiple conditions. Condition variables
    are evaluated as JSON path lookups into the input data (dict or list).

    Args:
        node: The rule node
        execution_id: Current execution ID
        input_data: Input data from previous node (dict or text)
        **kwargs: Additional context (unused)

    Returns:
        Dict with 'result' (bool), 'path' ('true'|'false'), and 'details' (str)

    Examples:
        input_data = {"status": "active", "score": 85}
        conditions = [{"variable": "status", "operator": "==", "value": "active"}]
        -> result=True, path='true'

        input_data = {"status": "active", "score": 85}
        conditions = [
            {"variable": "status", "operator": "==", "value": "active"},
            {"variable": "score", "operator": ">=", "value": "80"},
        ]
        logic = "AND"
        -> result=True (both conditions met)

        input_data = {"tags": ["important", "urgent"]}
        conditions = [{"variable": "tags", "operator": "in", "value": "urgent"}]
        -> result=True
    """
    data = node.data
    conditions = data.conditions if hasattr(data, "conditions") else []
    logic = data.logic if hasattr(data, "logic") else "AND"

    logger.info(f"[{node.id}] Evaluating rule with {len(conditions)} condition(s) ({logic})")

    # Parse input_data into a lookup context
    context: Dict[str, Any] = {}
    if isinstance(input_data, dict):
        context = input_data
    elif isinstance(input_data, str):
        # Try to parse as JSON, otherwise treat the whole string as the value
        try:
            context = json.loads(input_data)
        except (json.JSONDecodeError, TypeError):
            context = {"_text": input_data}
    elif input_data is not None:
        context = {"_value": input_data}

    logger.info(f"[{node.id}] Rule context keys: {list(context.keys())}")

    def resolve_value(variable: str) -> Any:
        """Resolve a variable path into the context (e.g. 'a.b.0' -> context['a']['b'][0])."""
        parts = variable.split(".")
        current: Any = context
        for part in parts:
            if isinstance(current, dict):
                current = current.get(part)
            elif isinstance(current, list):
                try:
                    idx = int(part)
                    current = current[idx]
                except (ValueError, IndexError):
                    return None
            else:
                return None
            if current is None:
                return None
        return current

    def evaluate_condition(condition: Any) -> bool:
        # Support both plain dicts and Pydantic models
        if hasattr(condition, "variable"):
            variable = condition.variable
            operator = condition.operator
            value = condition.value
        else:
            variable = condition.get("variable", "")
            operator = condition.get("operator", "==")
            value = condition.get("value", "")

        resolved = resolve_value(variable)
        logger.info(f"[{node.id}] Condition: '{variable}' {operator} '{value}' | resolved={resolved}")

        # Normalize types for comparison
        def to_number(v: Any) -> Optional[float]:
            if isinstance(v, (int, float)):
                return float(v)
            try:
                return float(str(v))
            except (ValueError, TypeError):
                return None

        resolved_num = to_number(resolved)
        value_num = to_number(value)

        if operator == "==":
            if resolved_num is not None and value_num is not None:
                return resolved_num == value_num
            return resolved == value
        elif operator == "!=":
            return resolved != value and resolved_num != value_num
        elif operator == ">":
            return resolved_num is not None and value_num is not None and resolved_num > value_num
        elif operator == "<":
            return resolved_num is not None and value_num is not None and resolved_num < value_num
        elif operator == ">=":
            return resolved_num is not None and value_num is not None and resolved_num >= value_num
        elif operator == "<=":
            return resolved_num is not None and value_num is not None and resolved_num <= value_num
        elif operator == "is":
            return resolved is not None and str(resolved).lower() == str(value).lower()
        elif operator == "is not":
            return str(resolved).lower() != str(value).lower()
        elif operator == "in":
            # Check if value is contained in resolved (list or string)
            if isinstance(resolved, list):
                return value in resolved
            elif isinstance(resolved, str):
                return value in resolved
            return False
        elif operator == "not in":
            if isinstance(resolved, list):
                return value not in resolved
            elif isinstance(resolved, str):
                return value not in resolved
            return True
        else:
            logger.warning(f"[{node.id}] Unknown operator '{operator}', treating as false")
            return False

    # Evaluate all conditions
    if not conditions:
        logger.warning(f"[{node.id}] No conditions defined, defaulting to false")
        result = False
    elif logic == "AND":
        result = all(evaluate_condition(c) for c in conditions)
    else:  # OR
        result = any(evaluate_condition(c) for c in conditions)

    path = "true" if result else "false"
    def cond_var(c): return c.variable if hasattr(c, "variable") else c.get("variable", "")
    def cond_op(c): return c.operator if hasattr(c, "operator") else c.get("operator", "==")
    def cond_val(c): return c.value if hasattr(c, "value") else c.get("value", "")

    conditions_summary = ", ".join(
        f"'{cond_var(c)}' {cond_op(c)} '{cond_val(c)}'"
        for c in conditions
    )
    details = f" {' AND ' if logic == 'AND' else ' OR '}. ".join(
        f"{'TRUE' if evaluate_condition(c) else 'FALSE'}: '{cond_var(c)}' {cond_op(c)} '{cond_val(c)}'"
        for c in conditions
    ) if conditions else "no conditions (default FALSE)"

    logger.info(f"[{node.id}] Rule result: {result} -> path='{path}' | {details}")

    return {
        "result": result,
        "path": path,
        "details": details,
        "conditions_count": len(conditions),
        "logic": logic,
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

