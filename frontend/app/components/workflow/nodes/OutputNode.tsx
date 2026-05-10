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
  
  // Local state for better reactivity
  const [format, setFormat] = useState(data.format ?? "json");
  const [fileName, setFileName] = useState(data.fileName ?? "output.json");

  return (
    <div
      className={`relative px-4 py-3 rounded-lg border-2 ${
 selected ? "border-teal-500" : "border-gray-300 dark:border-gray-600"
 } bg-white dark:bg-gray-900 shadow-lg min-w-[200px]`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-teal-500"
      />

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-teal-600" />
          <span className="font-semibold text-sm dark:text-white">Output Node</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
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
          className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded nodrag"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          >
            <label className="text-xs font-medium text-gray-700 dark:text-gray-200">
              Output Format:
            </label>
            <select
              className="w-full mt-1 text-xs border rounded px-2 py-1 nodrag"
              value={format}
              onChange={(e) => {
                const newFormat = e.target.value as OutputNodeData["format"];
                setFormat(newFormat);
                data.format = newFormat;
                // Auto-update extension when format changes
                const baseName =
                  data.fileName?.replace(/\.(txt|json|md)$/, "") || "output";
                data.fileName = `${baseName}.${newFormat}`;
                setFileName(data.fileName);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
          >
            <option value="json">JSON</option>
            <option value="txt">Text</option>
            <option value="md">Markdown</option>
            <option value="csv">CSV</option>
          </select>

            <label className="text-xs font-medium text-gray-700 dark:text-gray-200 mt-2 block">
              Output Filename:
            </label>
            <input
              type="text"
              className="w-full mt-1 text-xs border rounded px-2 py-1 nodrag"
              placeholder="output.json"
              value={fileName}
              onChange={(e) => {
                const newVal = e.target.value;
                setFileName(newVal);
                data.fileName = newVal;
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

      <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
        {data.fileName
          ? `${data.format?.toUpperCase() || 'TXT'}: ${data.fileName}`
          : data.label || "Configure output"}
      </div>
    </div>
  );
};
