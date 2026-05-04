import React, { useState } from "react";
import { Handle, Position, NodeProps, useReactFlow } from "reactflow";
import { Brain, Settings, Trash2 } from "lucide-react";
import { ReasoningNodeData } from "../../types/workflow";

export const ReasoningNode: React.FC<NodeProps<ReasoningNodeData>> = ({
  data,
  selected,
  id,
}) => {
  const { deleteElements } = useReactFlow();
  const [showConfig, setShowConfig] = useState(false);
  const [temperature, setTemperature] = useState(data.temperature ?? 0.7);
  const [prompt, setPrompt] = useState(data.prompt ?? "");
  const [model, setModel] = useState<ReasoningNodeData["model"]>(
    data.model ?? "claude-haiku-4-5"
  );

  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  // Initialize data fields if not set
  if (!data.prompt) data.prompt = "";
  if (!data.model) data.model = "claude-haiku-4-5";
  if (data.temperature === undefined) data.temperature = 0.7;

  return (
    <div
      className={`relative px-4 py-3 rounded-lg border-2 ${
        selected ? "border-teal-500" : "border-gray-300"
      } bg-white shadow-lg min-w-[250px]`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-teal-500"
      />

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-teal-600" />
          <span className="font-semibold text-sm">Reasoning Node</span>
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
            LLM Model:
          </label>
          <select
            className="w-full mt-1 text-xs border rounded px-2 py-1 nodrag"
            value={model}
            onChange={(e) => {
              const val = e.target.value as ReasoningNodeData["model"];
              setModel(val);
              data.model = val;
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
          >
            <option value="claude-haiku-4-5">Claude Haiku 4.5</option>
          </select>

          <label className="text-xs font-medium text-gray-700 mt-2 block">
            Prompt:
          </label>
          <textarea
            className="w-full mt-1 text-xs border rounded px-2 py-1 h-20 nodrag"
            placeholder="Enter your prompt here..."
            value={prompt}
            onChange={(e) => {
              const val = e.target.value;
              setPrompt(val);
              data.prompt = val;
            }}
            onMouseDown={(e) => e.stopPropagation()}
          />

          <label className="text-xs font-medium text-gray-700 mt-2 block">
            Temperature: {temperature.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setTemperature(val);
              data.temperature = val;
            }}
            className="w-full mt-1 nodrag"
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="text-xs text-gray-600 mt-1">
        {model === "claude-haiku-4-5" ? "Claude Haiku 4.5" : model} -{" "}
        {prompt ? "Configured" : "Set prompt"}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-teal-500"
      />
    </div>
  );
};
