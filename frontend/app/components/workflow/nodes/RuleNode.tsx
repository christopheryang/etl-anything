import React, { useState } from "react";
import { Handle, Position, NodeProps, useReactFlow } from "reactflow";
import { GitBranch, Settings, X, Trash2 } from "lucide-react";
import { RuleNodeData, RuleCondition } from "../../types/workflow";

export const RuleNode: React.FC<NodeProps<RuleNodeData>> = ({
  data,
  selected,
  id,
}) => {
  const { deleteElements } = useReactFlow();
  const [showConfig, setShowConfig] = useState(false);
  const [conditions, setConditions] = useState<RuleCondition[]>(
    data.conditions || [{ variable: "", operator: "==", value: "" }]
  );
  const [logic, setLogic] = useState<"AND" | "OR">(data.logic || "AND");

  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  const updateConditions = (newConditions: RuleCondition[]) => {
    setConditions(newConditions);
    data.conditions = newConditions;
  };

  const updateLogic = (newLogic: "AND" | "OR") => {
    setLogic(newLogic);
    data.logic = newLogic;
  };

  const handleConditionChange = (
    index: number,
    field: keyof RuleCondition,
    value: string
  ) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    updateConditions(newConditions);
  };

  const addCondition = () => {
    updateConditions([
      ...conditions,
      { variable: "", operator: "==", value: "" },
    ]);
  };

  const removeCondition = (index: number) => {
    if (conditions.length > 1) {
      const newConditions = conditions.filter((_, i) => i !== index);
      updateConditions(newConditions);
    }
  };

  const getRuleDisplay = () => {
    if (conditions.length === 0 || !conditions[0].variable) {
      return "Set rule conditions";
    }
    const count = conditions.filter((c) => c.variable).length;
    return `${count} condition${count !== 1 ? "s" : ""} (${logic})`;
  };

  const operatorOptions = [
    { value: "==", label: "is equal to" },
    { value: "!=", label: "is not equal to" },
    { value: ">", label: "is greater than" },
    { value: "<", label: "is less than" },
    { value: ">=", label: "is greater than or equal to" },
    { value: "<=", label: "is less than or equal to" },
    { value: "is", label: "is" },
    { value: "is not", label: "is not" },
    { value: "in", label: "contains" },
    { value: "not in", label: "does not contain" },
  ];

  return (
    <div
      className={`relative px-4 py-3 rounded-lg border-2 ${
 selected ? "border-teal-500" : "border-gray-300 dark:border-gray-600"
 } bg-white dark:bg-gray-900 shadow-lg min-w-[300px]`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-teal-500"
      />

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-teal-600" />
          <span className="font-semibold text-sm dark:text-white">Rule Node</span>
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
          className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded nodrag"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-2">
<label className="text-xs font-semibold text-gray-700 dark:text-gray-200">
 Conditions
            </label>
          </div>

          {conditions.map((condition, index) => (
            <div key={index}>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  className="flex-1 text-xs border rounded px-2 py-1.5 nodrag"
                  placeholder="value1"
                  value={condition.variable}
                  onChange={(e) =>
                    handleConditionChange(index, "variable", e.target.value)
                  }
                  onMouseDown={(e) => e.stopPropagation()}
                />
                <select
                  className="flex-1 text-xs border rounded px-2 py-1.5 nodrag bg-white dark:bg-gray-900"
                  value={condition.operator}
                  onChange={(e) =>
                    handleConditionChange(index, "operator", e.target.value)
                  }
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {operatorOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  className="flex-1 text-xs border rounded px-2 py-1.5 nodrag"
                  placeholder="value2"
                  value={condition.value}
                  onChange={(e) =>
                    handleConditionChange(index, "value", e.target.value)
                  }
                  onMouseDown={(e) => e.stopPropagation()}
                />
                <button
                  onClick={() => removeCondition(index)}
                  className="text-gray-400 hover:text-red-500 disabled:opacity-30"
                  disabled={conditions.length === 1}
                  title="Remove condition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {index < conditions.length - 1 && (
                <div className="flex items-center mb-2">
                  <select
                    className="text-xs border rounded px-2 py-1 nodrag bg-white dark:bg-gray-900"
                    value={logic}
                    onChange={(e) =>
                      updateLogic(e.target.value as "AND" | "OR")
                    }
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                  </select>
                </div>
              )}
            </div>
          ))}

          <button
            onClick={addCondition}
            className="w-full mt-2 text-xs border border-dashed border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-gray-600 dark:text-gray-300 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-white dark:hover:bg-gray-700 transition-colors"
            onMouseDown={(e) => e.stopPropagation()}
          >
            Add condition
          </button>

          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-2">
              Outputs
            </div>
            <div className="flex gap-2">
              <div className="flex-1 px-2 py-1 bg-green-50 border border-green-200 rounded">
                <label className="text-xs text-green-700 font-medium">
                  True
                </label>
              </div>
              <div className="flex-1 px-2 py-1 bg-red-50 border border-red-200 rounded">
                <label className="text-xs text-red-700 font-medium">
                  False
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">{getRuleDisplay()}</div>

      {/* True Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ top: "40%" }}
        className="w-3 h-3 bg-green-500"
      />

      {/* False Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ top: "60%" }}
        className="w-3 h-3 bg-red-500"
      />
    </div>
  );
};
