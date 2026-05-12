"use client";

import React, { useRef, useEffect, useState } from "react";
import { Send, Loader2, X } from "lucide-react";
import { PromptMessage } from "../types/workflow";

interface PromptPanelProps {
  onGenerate: (prompt: string) => Promise<void>;
  isGenerating: boolean;
  messages: PromptMessage[];
  onClose: () => void;
}

export const PromptPanel: React.FC<PromptPanelProps> = ({
  onGenerate,
  isGenerating,
  messages,
  onClose,
}) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || isGenerating) return;
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await onGenerate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            AI Workflow Builder
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Describe your ETL workflow in plain English
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
          title="Close panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">
            <div className="text-center space-y-2">
              <p className="text-base font-medium">Describe your workflow</p>
              <p className="text-xs">
                e.g. &quot;Read sample_data.csv, filter employees who joined in
                the last 12 months, and output as CSV&quot;
              </p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Generating workflow...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your workflow..."
            disabled={isGenerating}
            rows={2}
            className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isGenerating}
            className="flex-shrink-0 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Generate workflow"
          >
            {isGenerating ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
