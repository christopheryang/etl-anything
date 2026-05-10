import React from "react";
import { getSidebarNodes } from "./nodeConfig";

export const Sidebar: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="absolute left-4 top-20 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 w-64 z-10 pointer-events-none">
      <h3 className="font-semibold text-sm mb-3 pointer-events-none dark:text-gray-200">Node Library</h3>

      <div className="space-y-2">
        {getSidebarNodes().map(([type, config]) => {
          const Icon = config.icon;
          return (
            <div
              key={type}
              className="flex items-center gap-2 p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-move hover:border-teal-400 transition-colors pointer-events-auto"
              onDragStart={(event) => onDragStart(event, type)}
              draggable
            >
              <Icon className="w-5 h-5 text-teal-600" />
              <div>
                <div className="font-medium text-sm dark:text-gray-100">{config.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
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
