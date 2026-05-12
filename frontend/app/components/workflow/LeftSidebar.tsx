"use client";

import React from "react";
import {
  Save,
  Clock,
  BookOpen,
  Settings,
  User,
  ChevronRight,
  ChevronLeft,
  Moon,
  Sun,
  FolderOpen,
} from "lucide-react";

interface LeftSidebarProps {
  onSave: () => void;
  onOpen: () => void;
  onHistory: () => void;
  onTemplates: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  showSettingsMenu: boolean;
  setShowSettingsMenu: (show: boolean) => void;
  theme: string;
  setTheme: (theme: string) => void;
  availableModels: string[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  showMiniMap: boolean;
  setShowMiniMap: (show: boolean) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  onSave,
  onOpen,
  onHistory,
  onTemplates,
  isExpanded,
  onToggleExpand,
  showSettingsMenu,
  setShowSettingsMenu,
  theme,
  setTheme,
  availableModels,
  selectedModel,
  onModelChange,
  showMiniMap,
  setShowMiniMap,
}) => {
  return (
    <div
      className={`flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-200 relative ${
        isExpanded ? "w-56" : "w-14"
      }`}
    >
      {/* Expand/Collapse toggle */}
      <button
        onClick={onToggleExpand}
        className="absolute -right-3 top-4 p-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
        title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isExpanded ? (
          <ChevronLeft size={14} className="text-gray-600 dark:text-gray-300" />
        ) : (
          <ChevronRight size={14} className="text-gray-600 dark:text-gray-300" />
        )}
      </button>

      {/* Main action buttons */}
      <div className="flex flex-col gap-1 p-2 border-b border-gray-200 dark:border-gray-700">
        <ActionButton
          icon={<Save size={20} />}
          label="Save Workflow"
          onClick={onSave}
          expanded={isExpanded}
        />
        <ActionButton
          icon={<FolderOpen size={20} />}
          label="Open Workflow"
          onClick={onOpen}
          expanded={isExpanded}
      />
      <ActionButton
        icon={<Clock size={20} />}
          label="History"
          onClick={onHistory}
          expanded={isExpanded}
        />
        <ActionButton
          icon={<BookOpen size={20} />}
          label="Templates"
          onClick={onTemplates}
          expanded={isExpanded}
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings dropdown */}
      {showSettingsMenu && (
        <div className={`absolute bottom-14 ${isExpanded ? "left-56" : "left-14"} bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 w-60`}>
          <div className="p-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Settings
            </span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => {
              setTheme(theme === "dark" ? "light" : "dark");
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          </button>

          {/* MiniMap toggle */}
          <button
            onClick={() => setShowMiniMap(!showMiniMap)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="text-gray-700 dark:text-gray-200">MiniMap</span>
            <span className={`text-xs px-2 py-0.5 rounded ${showMiniMap ? "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
              {showMiniMap ? "On" : "Off"}
            </span>
          </button>

          {/* Model selector */}
          <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
              AI Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {availableModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
        <ActionButton
          icon={<Settings size={20} />}
          label="Settings"
          onClick={() => setShowSettingsMenu(!showSettingsMenu)}
          expanded={isExpanded}
        />
        <ActionButton
          icon={<User size={20} />}
          label="Profile"
          onClick={() => {}}
          expanded={isExpanded}
        />
      </div>
    </div>
  );
};

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  expanded: boolean;
  primary?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  onClick,
  expanded,
  primary = false,
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-md transition-colors ${
        expanded ? "px-3 py-2" : "p-3"
      } ${
        primary
          ? "bg-teal-600 hover:bg-teal-700 text-white"
          : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
      }`}
      title={!expanded ? label : undefined}
    >
      {icon}
      {expanded && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
};
