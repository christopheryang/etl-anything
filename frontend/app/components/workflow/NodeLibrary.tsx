"use client";

import React from "react";
import { HardDrive, FileText, GitBranch, FileOutput, ChevronUp, ChevronDown } from "lucide-react";
import { NODE_CONFIGS } from "./nodeConfig";

interface NodeLibraryProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export const NodeLibrary: React.FC<NodeLibraryProps> = ({
  isExpanded,
  onToggle,
}) => {
  const nodeTypes = [
    {
      type: "input",
      name: "Input",
      icon: <HardDrive size={16} />,
      description: "Load data from CSV, TXT, JSON, or PDF files",
      color: NODE_CONFIGS.input.color,
    },
    {
      type: "reasoning",
      name: "Reasoning (LLM)",
      icon: <FileText size={16} />,
      description: "Process data with AI (NVIDIA NIM, Claude, etc.)",
      color: NODE_CONFIGS.reasoning.color,
    },
    {
      type: "rule",
      name: "Rule",
      icon: <GitBranch size={16} />,
      description: "Branch workflow based on conditions",
      color: NODE_CONFIGS.rule.color,
    },
    {
      type: "output",
      name: "Output",
      icon: <FileOutput size={16} />,
      description: "Save results to CSV, JSON, MD, or TXT",
      color: NODE_CONFIGS.output.color,
    },
  ];

  const handleDragStart = (e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.setData("application/reactflow", nodeType);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      className={`bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 transition-all duration-200 ${
        isExpanded ? "h-48" : "h-9"
      }`}
    >
      {/* Header bar */}
      <div className="h-9 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Node Library
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Drag nodes to the canvas
          </span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          title={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? (
            <ChevronDown size={16} className="text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronUp size={16} className="text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* Node cards */}
      {isExpanded && (
        <div className="p-4 overflow-x-auto">
          <div className="flex gap-4">
            {nodeTypes.map((node) => (
              <div
                key={node.type}
                draggable
                onDragStart={(e) => handleDragStart(e, node.type)}
                className="flex-shrink-0 w-56 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-teal-500 dark:hover:border-teal-400 cursor-grab active:cursor-grabbing transition-colors bg-gray-50 dark:bg-gray-800"
                title={node.description}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-6 h-6 rounded-md flex items-center justify-center text-white"
                    style={{ backgroundColor: node.color }}
                  >
                    {node.icon}
                  </span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {node.name}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {node.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
