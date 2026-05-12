"use client";

import React, { useRef, useEffect, useState } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";
import { PromptMessage } from "../types/workflow";

interface ChatPanelProps {
  onGenerate: (prompt: string) => Promise<void>;
  isGenerating: boolean;
  messages: PromptMessage[];
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  onGenerate,
  isGenerating,
  messages,
}) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
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
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <div className="text-center space-y-3 max-w-md">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              ETL Anything
            </h2>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-md"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-md text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Generating workflow...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={"Describe your ETL workflow and I'll create it for you. For example: \"Read sample_data.csv, filter employees who joined in the last 12 months, split by city, and output a CSV file for each city\""}
            disabled={isGenerating}
            rows={2}
            className="flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isGenerating}
            className="flex-shrink-0 p-3 rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Generate workflow"
          >
            {isGenerating ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
