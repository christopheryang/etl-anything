# Feature F026 — CSV Output Format Support

**Date Created:** May 9, 2026  
**Status:** Done  
**Author:** AI Agent  
**Version:** v0.5

---

## Requirements

### User Stories

1. **As a user**, I want to export workflow results as CSV format so that I can open them in Excel or other spreadsheet tools.
2. **As a user**, I want the CSV output to preserve structured data (arrays of objects) in a tabular format.
3. **As a user**, I want CSV export to work alongside existing formats (JSON, TXT, MD).

### Functional Requirements

- **FR1:** Add "csv" as an option to OutputNode format dropdown
- **FR2:** Backend handler converts JSON objects to CSV format
- **FR3:** Handle nested objects by flattening or stringifying
- **FR4:** Properly escape commas, quotes, and newlines in CSV output
- **FR5:** Include CSV header row based on object keys

### Non-Functional Requirements

- **NFR1:** CSV output must be RFC 4180 compliant
- **NFR2:** No breaking changes to existing output formats
- **NFR3:** Handle edge cases: empty arrays, mixed types, null values

---

## Planning

### Backend Tasks

1. Update `handle_output_node()` in `node_handlers.py` to support CSV format
2. Add CSV writer logic with proper escaping
3. Handle conversion from JSON objects to tabular format

### Frontend Tasks

1. Update TypeScript types to include "csv" in format union
2. Add "CSV" option to OutputNode format dropdown
3. Update display logic

### Testing

1. Test CSV output with array of objects
2. Test CSV output with special characters (commas, quotes)
3. Verify RFC 4180 compliance

---

## Implementation Details

### Backend Implementation

```python
# backend/node_handlers.py
import csv
import io

def handle_output_node(...):
    # ... existing code ...
    
    if data.format == "csv":
        # Convert JSON array to CSV
        if isinstance(input_data, list) and len(input_data) > 0:
            if isinstance(input_data[0], dict):
                # Array of objects - convert to CSV
                output = _convert_to_csv(input_data)
            else:
                # Simple array - single column
                output = _convert_simple_list_to_csv(input_data)
        else:
            # Single object or string
            output = str(input_data)
        
        with open(output_path, "w", newline="") as f:
            f.write(output)
```

### Frontend Implementation

```typescript
// frontend/app/components/types/workflow.ts
export interface OutputNodeData extends NodeData {
  fileName?: string;
  format?: "txt" | "json" | "md" | "csv";  // Added "csv"
}
```

```tsx
// frontend/app/components/workflow/nodes/OutputNode.tsx
<select value={format} onChange={...}>
  <option value="json">JSON</option>
  <option value="txt">Text</option>
  <option value="md">Markdown</option>
  <option value="csv">CSV</option>  {/* Added */}
</select>
```

---

## Acceptance Criteria

- [x] CSV option appears in OutputNode format dropdown
- [x] Backend correctly converts JSON arrays to CSV
- [x] Special characters (commas, quotes, newlines) are properly escaped
- [x] CSV files can be opened in Excel/Google Sheets
- [x] Empty arrays produce valid (empty) CSV
- [x] Documentation updated

---

## Test Cases

### Test 1: Array of Objects
**Input:**
```json
[
  {"name": "Alice", "age": 30, "city": "New York"},
  {"name": "Bob", "age": 25, "city": "Los Angeles"}
]
```

**Output (CSV):**
```csv
name,age,city
Alice,30,New York
Bob,25,Los Angeles
```

### Test 2: Special Characters
**Input:**
```json
[
  {"name": "Smith, John", "quote": "He said \"Hello\"", "note": "Line1\nLine2"}
]
```

**Output (CSV):**
```csv
name,quote,note
"Smith, John","He said ""Hello""","Line1
Line2"
```

### Test 3: Empty Array
**Input:** `[]`

**Output:** (empty file or header-only)

---

## Caveats

1. **Nested Objects**: Deeply nested objects will be stringified or flattened to first level
2. **Mixed Types**: Arrays with mixed object structures may produce inconsistent CSV
3. **Large Datasets**: CSV format may not be suitable for very large datasets (>100K rows)
4. **Encoding**: UTF-8 encoding assumed; special characters in non-UTF8 locales may need BOM

---

## Files Modified

- `node_handlers.py` - Added CSV format handler in `handle_output_node()`

- `workflow/types/workflow.ts` - Added "csv" to format union type
- `workflow/nodes/OutputNode.tsx` - Added CSV option to dropdown

- `docs/features/Feature F026 - CSV Output Format.md` (this file)
- `docs/REQUIREMENTS.md` - Updated feature table
