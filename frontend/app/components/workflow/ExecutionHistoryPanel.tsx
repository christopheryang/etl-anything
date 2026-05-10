'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Trash2, Filter } from 'lucide-react';

interface ExecutionRecord {
  executionId: string;
  workflowId: string;
  workflowName: string;
  status: 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt: string | null;
  duration: number;
  error?: string | null;
}

interface ExecutionDetail extends ExecutionRecord {
  nodeResults: Array<{
    nodeId: string;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
    outputPreview?: string | null;
    error?: string | null;
  }>;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
}

interface ExecutionHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExecutionHistoryPanel({ isOpen, onClose }: ExecutionHistoryPanelProps) {
  const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<ExecutionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterWorkflow, setFilterWorkflow] = useState('');
  const [workflowList, setWorkflowList] = useState<string[]>([]);

  // Fetch executions when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchExecutions();
    }
  }, [isOpen, filterWorkflow]);

  const fetchExecutions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterWorkflow) {
        params.set('workflowId', filterWorkflow);
      }
      
      const response = await fetch(`/api/executions?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setExecutions(data.executions);
        
        // Extract unique workflow names for filter dropdown
        const uniqueWorkflows = Array.from(
          new Set(data.executions.map((e: ExecutionRecord) => e.workflowName))
        );
        setWorkflowList(uniqueWorkflows);
      }
    } catch (error) {
      console.error('Failed to fetch executions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExecutionDetail = async (executionId: string) => {
    try {
      const response = await fetch(`/api/executions/${executionId}/detail`);
      if (response.ok) {
        const detail = await response.json();
        setSelectedExecution(detail);
      }
    } catch (error) {
      console.error('Failed to fetch execution detail:', error);
    }
  };

  const handleDelete = async (executionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this execution history?')) return;

    try {
      const response = await fetch(`/api/executions/${executionId}/history`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchExecutions();
        if (selectedExecution?.executionId === executionId) {
          setSelectedExecution(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete execution:', error);
    }
  };

  const handleReplay = async (executionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Replay this execution with the same inputs?')) return;

    try {
      const response = await fetch(`/api/executions/${executionId}/replay`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        alert(`Replay started! New execution ID: ${data.execution_id}`);
        onClose();
      }
    } catch (error) {
      console.error('Failed to replay execution:', error);
      alert('Failed to replay execution');
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl h-[80vh] flex overflow-hidden">
        {/* Left Panel - Execution List */}
        <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Execution History
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Filter className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
              <select
                value={filterWorkflow}
                onChange={(e) => setFilterWorkflow(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">All Workflows</option>
                {workflowList.map((wf) => (
                  <option key={wf} value={wf}>
                    {wf}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Execution List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : executions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No executions found</div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {executions.map((execution) => (
                  <li
                    key={execution.executionId}
                    onClick={() => fetchExecutionDetail(execution.executionId)}
                    className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                      selectedExecution?.executionId === execution.executionId
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2 flex-1">
                        {getStatusIcon(execution.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {execution.workflowName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(execution.startedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDuration(execution.duration)}
                        </p>
                        <div className="flex items-center space-x-1 mt-1">
                          <button
                            onClick={(e) => handleReplay(execution.executionId, e)}
                            className="text-gray-400 hover:text-blue-500"
                            title="Replay"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(execution.executionId, e)}
                            className="text-gray-400 hover:text-red-500"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {execution.error && (
                      <p className="text-xs text-red-500 mt-1 truncate">{execution.error}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Panel - Execution Detail */}
        <div className="w-1/2 flex flex-col bg-gray-50 dark:bg-gray-800">
          {selectedExecution ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Execution Details
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ID: {selectedExecution.executionId}
                </p>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Status Summary */}
                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedExecution.status)}
                      <span className="font-medium capitalize text-gray-900 dark:text-white">
                        {selectedExecution.status}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDuration(selectedExecution.duration)}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <p>Started: {formatDate(selectedExecution.startedAt)}</p>
                    {selectedExecution.completedAt && (
                      <p>Completed: {formatDate(selectedExecution.completedAt)}</p>
                    )}
                  </div>
                </div>

                {/* Node Results */}
                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Node Results
                  </h4>
                  <div className="space-y-2">
                    {selectedExecution.nodeResults.map((node) => (
                      <div
                        key={node.nodeId}
                        className="text-xs p-2 rounded border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-gray-700 dark:text-gray-300">
                            {node.nodeId}
                          </span>
                          {getStatusIcon(node.status)}
                        </div>
                        {node.outputPreview && (
                          <p className="text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {node.outputPreview}
                          </p>
                        )}
                        {node.error && (
                          <p className="text-red-500 mt-1">{node.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Error Message */}
                {selectedExecution.error && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">
                      Error
                    </h4>
                    <p className="text-xs text-red-600 dark:text-red-300">
                      {selectedExecution.error}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              Select an execution to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
