"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Background,
  MiniMap,
  MarkerType,
  Node,
  Edge,
  Connection,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import { Play, Save, Download, ZoomIn, ZoomOut, Maximize2, Menu, X, Moon, Sun, Clock, BookOpen } from "lucide-react";
import { useTheme } from "next-themes";
import { nodeTypes } from "./nodes";
import { Sidebar } from "./Sidebar";
import { NodeData } from "../types/workflow";
import { NODE_CONFIGS } from "./nodeConfig";
import ExecutionHistoryPanel from "./ExecutionHistoryPanel";
import TemplateLibrary from "./TemplateLibrary";

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
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [editingZoom, setEditingZoom] = useState(false);
  const [zoomInputValue, setZoomInputValue] = useState("100");
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Theme hook
  const { theme, setTheme } = useTheme();

  // ReactFlow hooks — must be called at top level
  const { zoomTo, fitView, setViewport, getZoom } = useReactFlow();

  // Zoom tracking state
  const [zoomPercent, setZoomPercent] = useState(100);

  // Track zoom on any canvas pan/zoom
  const onMoveEnd = useCallback(() => {
    const z = getZoom();
    const pct = Math.round(z * 100);
    setZoomPercent(pct);
    setZoomInputValue(String(pct));
  }, [getZoom]);

  const zoomIn = useCallback(() => {
    const z = getZoom();
    const next = Math.min(2, z + 0.15);
    zoomTo(next);
    setZoomPercent(Math.round(next * 100));
  }, [zoomTo, getZoom]);

  const zoomOut = useCallback(() => {
    const z = getZoom();
    const next = Math.max(0.1, z - 0.15);
    zoomTo(next);
    setZoomPercent(Math.round(next * 100));
  }, [zoomTo, getZoom]);

  const resetZoom = useCallback(() => {
    setViewport({ x: 0, y: 0, zoom: 1 });
    setZoomPercent(100);
  }, [setViewport]);

  const fitViewToNodes = useCallback(() => {
    fitView({ padding: 0.2, duration: 300 });
    setTimeout(() => {
      const z = getZoom();
      setZoomPercent(Math.round(z * 100));
      setZoomInputValue(String(Math.round(z * 100)));
    }, 350);
  }, [fitView, getZoom]);

  const applyZoomInput = useCallback((value: string) => {
    setEditingZoom(false);
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 10) return;
    const clamped = Math.min(200, num);
    const zoom = clamped / 100;
    zoomTo(zoom);
    setZoomPercent(clamped);
    setZoomInputValue(String(clamped));
  }, [zoomTo]);

  // Edge connection
  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find((n) => n.id === params.source);
      const isRuleNode = sourceNode?.type === "rule";

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

  // Drag and drop from sidebar
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

      setWorkflowStatus(execution.status);

      if (execution.progress) {
        const { completed_nodes = 0, total_nodes = 1 } = execution.progress;
        setProgress(Math.round((completed_nodes / total_nodes) * 100));
      }

      if (execution.progress?.current_node) {
        setStatusMessage(`Processing node: ${execution.progress.current_node}`);
      }

      if (execution.status === "completed") {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsExecuting(false);
        setProgress(100);
        setStatusMessage("Workflow completed successfully!");

        // Auto-reset after 10 seconds
        setTimeout(() => {
          setWorkflowStatus("idle");
          setStatusMessage("");
          setProgress(0);
        }, 10000);
      } else if (execution.status === "failed") {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsExecuting(false);
        setStatusMessage(
          `Error: ${execution.error || "Unknown error occurred"}`
        );

        setTimeout(() => {
          setWorkflowStatus("idle");
          setStatusMessage("");
          setProgress(0);
        }, 10000);
      }
    } catch (error) {
      console.error("Polling error:", error);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setWorkflowStatus("failed");
      setStatusMessage(
        `Error: ${error instanceof Error ? error.message : "Polling failed"}`
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

      const workflowDefinition = {
        nodes: nodes
          .map((node) => {
            const nodeType = node.type as string;
            const config = NODE_CONFIGS[nodeType];
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

      if (workflowDefinition.nodes.length === 0) {
        setWorkflowStatus("failed");
        setStatusMessage("Error: Workflow is empty. Please add nodes.");
        setIsExecuting(false);
        return;
      }

      console.log(
        "Sending workflow:",
        JSON.stringify(workflowDefinition, null, 2)
      );

      const response = await fetch("/api/workflows/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      pollingIntervalRef.current = setInterval(() => {
        pollJobStatus(executionId);
      }, 1500);
      pollJobStatus(executionId);
    } catch (error) {
      console.error("Workflow error:", error);
      setWorkflowStatus("failed");
      setStatusMessage(
        `Error: ${
          error instanceof Error ? error.message : "Unknown error occurred"
        }`
      );
      setIsExecuting(false);
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
      const contentDisposition = response.headers.get("content-disposition");
      let filename = "output.txt";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/^"|"$/g, "");
        }
      }
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

  const loadTemplate = (workflow: any) => {
    // Load template workflow onto canvas
    setNodes(workflow.nodes.map((node: any) => ({
      ...node,
      data: node.data,
    })));
    setEdges(workflow.edges.map((edge: any) => ({
      ...edge,
      type: edge.type || 'default',
    })));
    setWorkflowName(`Template: ${new Date().toLocaleDateString()}`);
    fitView({ padding: 0.3, duration: 300 });
  };

  return (
 <div className="w-full h-screen bg-gray-50 dark:bg-gray-950">
 {/* Header */}
 <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between dark:bg-gray-900 dark:border-gray-800">
 <div className="flex items-center gap-4">
 <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">ETL Anything</h1>
 <input
 type="text"
 value={workflowName}
 onChange={(e) => setWorkflowName(e.target.value)}
 className="px-3 py-1 text-sm border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
 />
 </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
 <div className="flex items-center gap-1 border border-gray-300 rounded-md px-1 py-1 bg-white dark:bg-gray-800 dark:border-gray-700">
 <button
 onClick={zoomOut}
 className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
 title="Zoom out"
 >
 <ZoomOut className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            {editingZoom ? (
              <input
                type="text"
                value={zoomInputValue}
                onChange={(e) => setZoomInputValue(e.target.value)}
                onBlur={() => applyZoomInput(zoomInputValue)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyZoomInput(zoomInputValue);
                  if (e.key === "Escape") {
                    setEditingZoom(false);
                    setZoomInputValue(String(zoomPercent));
                  }
                }}
                className="w-12 text-xs text-center border-none bg-transparent font-medium text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-teal-400 rounded px-0.5"
                autoFocus
              />
            ) : (
              <span
                onClick={() => {
                  setEditingZoom(true);
                  setZoomInputValue(String(zoomPercent));
                }}
                className="text-xs text-gray-600 dark:text-gray-300 font-medium w-12 text-center cursor-text hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1 py-0.5 transition-colors"
                title="Click to edit zoom level"
              >
                {zoomPercent}%
              </span>
            )}
 <button
 onClick={zoomIn}
 className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
 title="Zoom in"
 >
 <ZoomIn className="w-4 h-4 text-gray-600 dark:text-gray-300" />
 </button>
 <button
 onClick={fitViewToNodes}
 className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
 title="Fit all nodes in view"
 >
 <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

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
<button className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors">
<Save className="w-4 h-4" />
Save
</button>
<button
onClick={() => setShowHistoryPanel(true)}
className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors"
>
<Clock className="w-4 h-4" />
History
</button>
<button
onClick={() => setShowTemplateLibrary(true)}
className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors"
>
<BookOpen className="w-4 h-4" />
Templates
</button>

 {/* Settings menu — far right */}
 <button
 onClick={() => setShowSettingsMenu(!showSettingsMenu)}
 className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors"
 >
 <Menu className="w-4 h-4" />
 </button>

 {/* Settings dropdown */}
 {showSettingsMenu && (
 <div className="absolute right-4 top-16 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-56 dark:bg-gray-900 dark:border-gray-700">
 <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800">
 <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Settings</span>
 <button
 onClick={() => setShowSettingsMenu(false)}
 className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
 >
 <X className="w-4 h-4 dark:text-gray-400" />
 </button>
 </div>
 <div className="py-1">
 {/* Theme toggle */}
 <button
 onClick={() => {
 setTheme(theme === "dark" ? "light" : "dark");
 setShowSettingsMenu(false);
 }}
 className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
 >
 <span className="text-gray-700 dark:text-gray-200 flex items-center gap-2">
 {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
 Theme
 </span>
 <span className={`text-xs font-medium ${theme === "dark" ? "text-teal-600" : "text-gray-400"}`}>
 {theme === "dark" ? "Dark" : "Light"}
 </span>
 </button>

 <button
 onClick={() => {
 setShowMiniMap(!showMiniMap);
 setShowSettingsMenu(false);
 }}
 className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
 >
 <span className="text-gray-700 dark:text-gray-200">MiniMap</span>
 <span className={`text-xs font-medium ${showMiniMap ? "text-teal-600" : "text-gray-400"}`}>
 {showMiniMap ? "On" : "Off"}
 </span>
 </button>
 <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800">
 <span className="text-xs text-gray-500 dark:text-gray-400">Zoom: {zoomPercent}%</span>
 </div>
 </div>
 </div>
 )}

 </div>
 </div>

 {/* Status Bar */}
 {workflowStatus !== "idle" && (
 <div className="bg-white border-b border-gray-200 px-6 py-2 dark:bg-gray-900 dark:border-gray-800">
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
 <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
 {workflowStatus === "pending" && "Submitting workflow..."}
 {workflowStatus === "processing" &&
 `Processing... ${progress}%`}
 {workflowStatus === "completed" && "Complete"}
 {workflowStatus === "failed" && "Error"}
 </span>
 </div>
 <div className="flex-1 flex items-center gap-3">
 <span className="text-sm text-gray-600 dark:text-gray-300">{statusMessage}</span>
 {workflowStatus === "processing" && (
 <div className="flex-1 max-w-xs">
 <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
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
          onMoveEnd={onMoveEnd}
          nodeTypes={nodeTypes}
 className="bg-gray-50 dark:bg-gray-950"
 >
 <Background color="#e5e7eb" gap={20} className="dark:opacity-20" />
 {showMiniMap && (
 <MiniMap
 nodeColor={(node) => {
 const config = NODE_CONFIGS[node.type as string];
 return config?.color || "#6b7280";
 }}
 className="bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700"
 />
          )}
        </ReactFlow>

        <Sidebar />
        
        {/* Execution History Panel */}
        <ExecutionHistoryPanel
          isOpen={showHistoryPanel}
          onClose={() => setShowHistoryPanel(false)}
        />
        
        {/* Template Library Modal */}
        <TemplateLibrary
          isOpen={showTemplateLibrary}
          onClose={() => setShowTemplateLibrary(false)}
          onLoadTemplate={loadTemplate}
        />
      </div>
    </div>
  );
};

export default WorkflowCanvas;
