"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  FolderOpen,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Trash2,
} from "lucide-react";

interface WorkflowMeta {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  node_count: number;
  edge_count: number;
}

interface WorkflowBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadWorkflow: (id: string, name: string) => void;
  onDeleteWorkflow?: (id: string) => void;
}

export default function WorkflowBrowser({
  isOpen,
  onClose,
  onLoadWorkflow,
  onDeleteWorkflow,
}: WorkflowBrowserProps) {
  const [workflows, setWorkflows] = useState<WorkflowMeta[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState<"name" | "created_at" | "updated_at">(
    "updated_at"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchWorkflows = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: "1",
        page_size: "1000",
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      const res = await fetch(`/api/workflows?${params}`);
      if (!res.ok) throw new Error("Failed to load workflows");
      const data = await res.json();
      setWorkflows(data.workflows || []);
      setTotalCount(data.total_count ?? data.workflows?.length ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [sortBy, sortOrder]);

  useEffect(() => {
    if (isOpen) fetchWorkflows();
  }, [isOpen, fetchWorkflows]);

  const toggleSort = (col: "name" | "created_at" | "updated_at") => {
    if (sortBy === col) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortOrder("desc");
    }
  };

  const SortIcon = ({
    col,
  }: {
    col: "name" | "created_at" | "updated_at";
  }) => {
    if (sortBy !== col)
      return <ArrowUpDown size={12} className="text-gray-400" />;
    return sortOrder === "asc" ? (
      <ArrowUp size={12} className="text-teal-600" />
    ) : (
      <ArrowDown size={12} className="text-teal-600" />
    );
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${name}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete workflow");
      fetchWorkflows();
      if (onDeleteWorkflow) onDeleteWorkflow(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const filteredWorkflows = workflows.filter(
    (wf) =>
      wf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wf.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-2">
            <FolderOpen size={18} className="text-teal-600" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Open Workflow
            </h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({filteredWorkflows.length} of {totalCount} workflows)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {isLoading && workflows.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-teal-600" />
            </div>
          ) : error ? (
            <div className="px-4 py-8 text-center text-sm text-red-500">
              {error}
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              {searchQuery
                ? "No workflows match your search."
                : "No saved workflows yet. Save a workflow to see it here."}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200"
                    onClick={() => toggleSort("name")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Name <SortIcon col="name" />
                    </span>
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200"
                    onClick={() => toggleSort("created_at")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Created <SortIcon col="created_at" />
                    </span>
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200"
                    onClick={() => toggleSort("updated_at")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Updated <SortIcon col="updated_at" />
                    </span>
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                    Nodes
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 w-10">
                    {/* Actions column header */}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredWorkflows.map((wf) => (
                  <tr
                    key={wf.id}
                    onClick={() => {
                      onLoadWorkflow(wf.id, wf.name);
                      onClose();
                    }}
                    className="group cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                        {wf.name}
                      </div>
                      {wf.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                          {wf.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(wf.created_at)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(wf.updated_at)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-gray-600 dark:text-gray-400">
                      {wf.node_count}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(wf.id, wf.name);
                        }}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-all"
                        title="Delete workflow"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}