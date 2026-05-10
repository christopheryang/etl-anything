#!/usr/bin/env python3
"""
Audit and update all feature documentation files to match actual implementation.
Run this when features are missing or docs are out of date.
"""

import os
import re

DOCS_DIR = "/Users/christopher.yang/GitRepo/etl-anything/docs/features"

# Features that are actually implemented in the UI
IMPLEMENTED = {
    "F003": "File Upload UI for InputNode",
    "F008": "Dark Mode Theme Toggle",
    "F016": "MiniMap Toggle Button",
}

# Backend-only features (no UI needed)
BACKEND_ONLY = {
    "F002": "Backend GET /api/files Endpoint",
    "F006": "Model Mapping Expansion",
    "F007": "System Prompt for LLM Nodes",
}

# Partially implemented
PARTIAL = {
    "F001": "Workflow Import/Export JSON",  # Export via Save, Import missing
    "F019": "Pre-Run Validation",  # Basic validation exists
}

# Missing features (docs say Done but not implemented)
MISSING = [
    "F004",  # Execution Cancellation
    "F005",  # Load Workflow Modal
    "F009",  # Node Execution Logs Panel
    "F010",  # Keyboard Shortcuts
    "F011",  # Node Tooltip
    "F012",  # Orphaned Node Validation
    "F013",  # Undo/Redo
    "F014",  # New Workflow Button
    "F015",  # Delete Selected Nodes
    "F017",  # Auto-Layout Button
    "F018",  # Workflow Stats
    "F020",  # Help Modal
    "F021",  # Toast Notifications
]

def update_feature_file(filename):
    """Update a single feature file to reflect actual implementation status."""
    filepath = os.path.join(DOCS_DIR, filename)
    if not os.path.exists(filepath):
        return False
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Extract feature ID from filename
    match = re.search(r'Feature (F\d+)', filename)
    if not match:
        return False
    
    feature_id = match.group(1)
    
    # Check current status
    status_match = re.search(r'\*\*Status:\*\* (.+)', content)
    if not status_match:
        return False
    
    current_status = status_match.group(1).strip()
    
    # Determine new status
    if feature_id in IMPLEMENTED:
        new_status = "Done"
        note = ""
    elif feature_id in BACKEND_ONLY:
        new_status = "Done (backend only)"
        note = "\n\n> **Note:** This is a backend-only feature. No UI component required."
    elif feature_id in PARTIAL:
        new_status = "Partial"
        note = "\n\n> **Note:** Partially implemented. See implementation details below."
    elif feature_id in MISSING:
        new_status = "Pending (not implemented)"
        note = "\n\n> **Note:** This feature was documented but never implemented in the UI."
    else:
        return False  # Unknown feature
    
    # Update status line
    if current_status != new_status:
        content = re.sub(
            r'\*\*Status:\*\* .+',
            f'**Status:** {new_status}',
            content
        )
        
        # Add note if not already present
        if note and note not in content:
            # Add after status line
            content = re.sub(
                r'(\*\*Status:\*\* .+\n)',
                f'\\1{note}',
                content,
                count=1
            )
        
        with open(filepath, 'w') as f:
            f.write(content)
        
        return True
    
    return False

def main():
    updated = []
    for filename in os.listdir(DOCS_DIR):
        if filename.startswith("Feature F") and filename.endswith(".md"):
            if update_feature_file(filename):
                updated.append(filename)
    
    print(f"Updated {len(updated)} feature files:")
    for f in updated:
        print(f"  - {f}")

if __name__ == "__main__":
    main()
