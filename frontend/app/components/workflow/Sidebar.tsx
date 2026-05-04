import React from "react";
import { getSidebarNodes } from "./nodeConfig";

export const Sidebar: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="absolute left-4 top-20 bg-white rounded-lg shadow-lg p-4 w-64 z-10">
      <h3 className="font-semibold text-sm mb-3">Node Library</h3>

      <div className="space-y-2">
        {getSidebarNodes().map(([type, config]) => {
          const Icon = config.icon;
          return (
            <div
              key={type}
              className="flex items-center gap-2 p-3 border-2 border-gray-200 rounded-lg cursor-move hover:border-teal-400 transition-colors"
              onDragStart={(event) => onDragStart(event, type)}
              draggable
            >
              <Icon className="w-5 h-5 text-teal-600" />
              <div>
                <div className="font-medium text-sm">{config.label}</div>
                <div className="text-xs text-gray-500">
                  {config.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
