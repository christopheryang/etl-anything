"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  MarkerType,
  Node,
  Edge,
  Connection,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import { Play, Save, Download } from "lucide-react";
import { nodeTypes } from "./nodes";
import { Sidebar } from "./Sidebar";
import { NodeData } from "../types/workflow";
import { NODE_CONFIGS } from "./nodeConfig";

const WorkflowCanvas: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [workflowName, setWorkflowName] = useState("Untitled Workflow");
  const [workflowStatus, setWorkflowStatus] = useState<
    "idle" | "pending" | "processing" | "completed" | "failed"
  >("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(
    null
  );
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      // Check if this edge is from a rule node to add labels
      const sourceNode = nodes.find((n) => n.id === params.source);
      const isRuleNode = sourceNode?.type === "rule";

      // Determine label and style based on source handle
      let edgeLabel = "";
      let edgeStyle = { stroke: "#14b8a6", strokeWidth: 2 };
      let labelStyle = {};
      const labelBgStyle = { fill: "#ffffff", fillOpacity: 0.9 };

      if (isRuleNode && params.sourceHandle) {
        if (params.sourceHandle === "true") {
          edgeLabel = "True";
          edgeStyle = { stroke: "#22c55e", strokeWidth: 2 };
          labelStyle = { fill: "#15803d", fontWeight: 600, fontSize: 12 };
        } else if (params.sourceHandle === "false") {
          edgeLabel = "False";
          edgeStyle = { stroke: "#ef4444", strokeWidth: 2 };
          labelStyle = { fill: "#991b1b", fontWeight: 600, fontSize: 12 };
        }
      }

      return setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "smoothstep",
            animated: true,
            style: edgeStyle,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: edgeStyle.stroke,
            },
            ...(edgeLabel && {
              label: edgeLabel,
              labelStyle: labelStyle,
              labelBgStyle: labelBgStyle,
            }),
          },
          eds
        )
      );
    },
    [setEdges, nodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (typeof type === "undefined" || !type) {
        return;
      }

      if (!reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node<NodeData> = {
        id: `${type}_${+new Date()}`,
        type,
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance, setNodes]
  );

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Poll for execution status
  const pollJobStatus = useCallback(async (executionId: string) => {
    try {
      const response = await fetch(`/api/executions/${executionId}/status`);

      if (!response.ok) {
        throw new Error("Failed to fetch execution status");
      }

      const execution = await response.json();

      // Update UI based on execution status
      setWorkflowStatus(execution.status);

      // Calculate progress from node completion
      if (execution.progress) {
        const { completed_nodes = 0, total_nodes = 1 } = execution.progress;
        setProgress(Math.round((completed_nodes / total_nodes) * 100));
      }

      // Set status message
      if (execution.progress?.current_node) {
        setStatusMessage(`Processing node: ${execution.progress.current_node}`);
      }

      // Stop polling if execution is complete or failed
      if (execution.status === "completed") {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        setIsExecuting(false);
        setProgress(100);
        setStatusMessage("✅ Workflow completed successfully!");

        // Don't auto-reset - let user see result and download
      } else if (execution.status === "failed") {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        setIsExecuting(false);
        setStatusMessage(
          `❌ Error: ${execution.error || "Unknown error occurred"}`
        );

        // Reset status after 10 seconds
        setTimeout(() => {
          setWorkflowStatus("idle");
          setStatusMessage("");
          setProgress(0);
        }, 10000);
      }
    } catch (error) {
      console.error("Polling error:", error);

      // Stop polling on error
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      setWorkflowStatus("failed");
      setStatusMessage(
        `❌ Error: ${error instanceof Error ? error.message : "Polling failed"}`
      );
      setIsExecuting(false);
    }
  }, []);

  const runWorkflow = async () => {
    try {
      setIsExecuting(true);
      setWorkflowStatus("pending");
      setStatusMessage("Submitting workflow...");
      setProgress(0);

      // Build workflow definition from React Flow state
      const workflowDefinition = {
        nodes: nodes
          .map((node) => {
            // Get node configuration
            const nodeType = node.type as string;
            const config = NODE_CONFIGS[nodeType];

            // Skip nodes without config or without backend support
            if (!config || !config.backendType) {
              return null;
            }

            return {
              id: node.id,
              type: config.backendType,
              position: node.position,
              data: config.dataMapper(node.data),
            };
          })
          .filter((node): node is NonNullable<typeof node> => node !== null),
        edges: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
        })),
      };

      // Validate workflow has nodes
      if (workflowDefinition.nodes.length === 0) {
        setWorkflowStatus("failed");
        setStatusMessage("Error: Workflow is empty. Please add nodes.");
        setIsExecuting(false);
        return;
      }

      // Debug: log what we're sending
      console.log(
        "Sending workflow:",
        JSON.stringify(workflowDefinition, null, 2)
      );

      // Submit workflow to backend
      const response = await fetch("/api/workflows/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workflow: workflowDefinition }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Workflow submission failed");
      }

      const result = await response.json();
      const executionId = result.execution_id;

      setCurrentExecutionId(executionId);
      setStatusMessage("Workflow submitted! Polling for status...");

      // Start polling for status
      pollingIntervalRef.current = setInterval(() => {
        pollJobStatus(executionId);
      }, 1500); // Poll every 1.5 seconds

      // Also poll immediately
      pollJobStatus(executionId);
    } catch (error) {
      console.error("Workflow error:", error);
      setWorkflowStatus("failed");
      setStatusMessage(
        `❌ Error: ${
          error instanceof Error ? error.message : "Unknown error occurred"
        }`
      );
      setIsExecuting(false);

      // Reset status after 10 seconds
      setTimeout(() => {
        setWorkflowStatus("idle");
        setStatusMessage("");
        setProgress(0);
      }, 10000);
    }
  };

  const downloadOutput = async () => {
    if (!currentExecutionId) return;

    try {
      const response = await fetch(
        `/api/executions/${currentExecutionId}/download`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Download failed");
      }

      // Get filename from content-disposition header if available
      const contentDisposition = response.headers.get("content-disposition");
      let filename = "output.txt";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/^"|"$/g, ""); // Remove leading/trailing quotes
        }
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      alert(
        `Download failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <div className="w-full h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">ETL Anything</h1>
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="px-3 py-1 text-sm border rounded-md"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runWorkflow}
            disabled={isExecuting}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
              isExecuting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-teal-600 hover:bg-teal-700"
            } text-white`}
          >
            <Play className="w-4 h-4" />
            {isExecuting ? "Running..." : "Run Workflow"}
          </button>
          {workflowStatus === "completed" && currentExecutionId && (
            <button
              onClick={downloadOutput}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Output
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      {/* Status Bar */}
      {workflowStatus !== "idle" && (
        <div className="bg-white border-b border-gray-200 px-6 py-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  workflowStatus === "completed"
                    ? "bg-green-500"
                    : workflowStatus === "failed"
                    ? "bg-red-500"
                    : "bg-blue-500 animate-pulse"
                }`}
              />
              <span className="text-sm font-medium text-gray-700">
                {workflowStatus === "pending" && "Submitting workflow..."}
                {workflowStatus === "processing" &&
                  `Processing... ${progress}%`}
                {workflowStatus === "completed" && "Complete"}
                {workflowStatus === "failed" && "Error"}
              </span>
            </div>
            <div className="flex-1 flex items-center gap-3">
              <span className="text-sm text-gray-600">{statusMessage}</span>
              {workflowStatus === "processing" && (
                <div className="flex-1 max-w-xs">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Canvas */}
      <ReactFlowProvider>
        <div
          className={`w-full ${
            workflowStatus !== "idle"
              ? "h-[calc(100vh-112px)]"
              : "h-[calc(100vh-60px)]"
          }`}
          ref={reactFlowWrapper}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50"
          >
            <Background color="#e5e7eb" gap={20} />
            <MiniMap
              nodeColor={(node) => {
                const config = NODE_CONFIGS[node.type as string];
                return config?.color || "#6b7280";
              }}
              className="bg-white border border-gray-200"
            />
            <Controls className="bg-white border border-gray-200" />
          </ReactFlow>

          <Sidebar />
        </div>
      </ReactFlowProvider>
    </div>
  );
};

export default WorkflowCanvas;
