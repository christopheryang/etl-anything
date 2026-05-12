"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Save } from "lucide-react";

interface SaveWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  defaultName: string;
  isSaving: boolean;
}

export default function SaveWorkflowModal({
  isOpen,
  onClose,
  onSave,
  defaultName,
  isSaving,
}: SaveWorkflowModalProps) {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(defaultName === "Untitled Workflow" ? "" : defaultName);
      setDescription("");
      setError("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, defaultName]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Workflow name is required");
      return;
    }
    if (trimmed === "Untitled Workflow") {
      setError("Please choose a different name");
      return;
    }
    if (trimmed.length > 100) {
      setError("Name must be 100 characters or less");
      return;
    }
    onSave(trimmed, description.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Save size={18} className="text-teal-600" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Save Workflow
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              placeholder="Enter workflow name"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              maxLength={100}
            />
            {error && (
              <p className="mt-1 text-xs text-red-500">{error}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
              maxLength={500}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors flex items-center gap-1.5"
          >
            <Save size={14} />
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
