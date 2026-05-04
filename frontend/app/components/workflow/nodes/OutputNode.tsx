import React, { useState } from "react";
import { Handle, Position, NodeProps, useReactFlow } from "reactflow";
import { Download, Settings, Trash2 } from "lucide-react";
import { OutputNodeData } from "../../types/workflow";

export const OutputNode: React.FC<NodeProps<OutputNodeData>> = ({
  data,
  selected,
  id,
}) => {
  const { deleteElements } = useReactFlow();
  const [showConfig, setShowConfig] = useState(false);

  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  // Initialize data fields if not set
  if (!data.format) data.format = "json";
  if (!data.fileName) data.fileName = "output.json";

  return (
    <div
      className={`relative px-4 py-3 rounded-lg border-2 ${
        selected ? "border-teal-500" : "border-gray-300"
      } bg-white shadow-lg min-w-[200px]`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-teal-500"
      />

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-teal-600" />
          <span className="font-semibold text-sm">Output Node</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Delete node"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showConfig && (
        <div
          className="mt-2 p-2 bg-gray-50 rounded nodrag"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <label className="text-xs font-medium text-gray-700">
            Output Format:
          </label>
          <select
            className="w-full mt-1 text-xs border rounded px-2 py-1 nodrag"
            value={data.format}
            onChange={(e) => {
              data.format = e.target.value as OutputNodeData["format"];
              // Auto-update extension when format changes
              const baseName =
                data.fileName?.replace(/\.(txt|json|md)$/, "") || "output";
              data.fileName = `${baseName}.${e.target.value}`;
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <option value="json">JSON</option>
            <option value="txt">Text</option>
            <option value="md">Markdown</option>
          </select>

          <label className="text-xs font-medium text-gray-700 mt-2 block">
            Output Filename:
          </label>
          <input
            type="text"
            className="w-full mt-1 text-xs border rounded px-2 py-1 nodrag"
            placeholder="output.json"
            value={data.fileName}
            onChange={(e) => {
              data.fileName = e.target.value;
            }}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="text-xs text-gray-600 mt-1">
        {data.fileName
          ? `📝 ${data.fileName}`
          : data.label || "Configure output"}
      </div>
    </div>
  );
};
