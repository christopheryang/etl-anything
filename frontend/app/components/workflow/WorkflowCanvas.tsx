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
import { useTheme } from "next-themes";
import { ZoomIn, ZoomOut, Play, Save } from "lucide-react";
import { nodeTypes } from "./nodes";
import { NodeData, PromptMessage } from "../types/workflow";
import { NODE_CONFIGS } from "./nodeConfig";
import ExecutionHistoryPanel from "./ExecutionHistoryPanel";
import TemplateLibrary from "./TemplateLibrary";
import { LeftSidebar } from "./LeftSidebar";
import { ChatPanel } from "./ChatPanel";
import { NodeLibrary } from "./NodeLibrary";
import SaveWorkflowModal from "./SaveWorkflowModal";
import WorkflowBrowser from "./WorkflowBrowser";

const AVAILABLE_MODELS = [
  "qwen/qwen3.5-397b-a17b",
  "minimax/minimax-m2.7",
  "thudm/glm-4.7",
  "haiku-4.5",
  "sonnet-4.7",
  "opus-4.7",
];

const MODEL_LABELS: Record<string, string> = {
  "qwen/qwen3.5-397b-a17b": "Qwen 3.5 397B (NVIDIA)",
  "minimax/minimax-m2.7": "MiniMax M2.7 (NVIDIA)",
  "thudm/glm-4.7": "GLM 4.7 (NVIDIA)",
  "haiku-4.5": "Claude Haiku 4.5",
  "sonnet-4.7": "Claude Sonnet 4.7",
  "opus-4.7": "Claude Opus 4.7",
};

const WorkflowCanvas: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [workflowName, setWorkflowName] = useState("Untitled Workflow");
  const [workflowId, setWorkflowId] = useState<string | null>(null);
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
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showWorkflowBrowser, setShowWorkflowBrowser] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [promptMessages, setPromptMessages] = useState<PromptMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState(
    "qwen/qwen3.5-397b-a17b"
  );
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [nodeLibraryExpanded, setNodeLibraryExpanded] = useState(false);

  // Draggable splitter state — stores chat panel height in pixels
  const [chatPanelHeight, setChatPanelHeight] = useState(350);
  const isDraggingSplitter = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Theme hook
  const { theme, setTheme } = useTheme();

  // ReactFlow hooks
  const { zoomTo, fitView, getZoom } = useReactFlow();

 const [zoomPercent, setZoomPercent] = useState(100);
 const [zoomInputValue, setZoomInputValue] = useState("100%");

 // Sync zoom display after ReactFlow initializes
 useEffect(() => {
 if (reactFlowInstance) {
 const z = reactFlowInstance.getZoom();
 const pct = Math.round(z * 100);
 setZoomPercent(pct);
 setZoomInputValue(`${pct}%`);
 }
 }, [reactFlowInstance]);

 const onMoveEnd = useCallback(() => {
 const z = getZoom();
 const pct = Math.round(z * 100);
 setZoomPercent(pct);
 setZoomInputValue(`${pct}%`);
 }, [getZoom]);

 const applyZoomInput = useCallback(() => {
 const raw = zoomInputValue.replace(/%/, "");
 const num = parseInt(raw, 10);
 if (!isNaN(num) && num >= 10 && num <= 200) {
 const z = num / 100;
 zoomTo(z);
 setZoomPercent(num);
 setZoomInputValue(`${num}%`);
 } else {
 // Revert to current actual zoom
 const pct = Math.round(getZoom() * 100);
 setZoomPercent(pct);
 setZoomInputValue(`${pct}%`);
 }
 }, [zoomInputValue, zoomTo, getZoom]);

 const zoomInAction = useCallback(() => {
 const z = getZoom();
 const next = Math.min(2, z + 0.15);
 zoomTo(next);
 const pct = Math.round(next * 100);
 setZoomPercent(pct);
 setZoomInputValue(`${pct}%`);
 }, [zoomTo, getZoom]);

 const zoomOutAction = useCallback(() => {
 const z = getZoom();
 const next = Math.max(0.1, z - 0.15);
 zoomTo(next);
 const pct = Math.round(next * 100);
 setZoomPercent(pct);
 setZoomInputValue(`${pct}%`);
  }, [zoomTo, getZoom]);

  // ──── Draggable splitter ────
  const handleSplitterMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingSplitter.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSplitter.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newHeight = e.clientY - rect.top;
      const clamped = Math.max(120, Math.min(newHeight, rect.height - 120));
      setChatPanelHeight(clamped);
    };

    const handleMouseUp = () => {
      if (isDraggingSplitter.current) {
        isDraggingSplitter.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // ──── Edge connection ────
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

  // ──── Drag and drop from sidebar ────
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

  // ──── Cleanup polling on unmount ────
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // ──── Track unsaved changes & auto-save ────
  useEffect(() => {
    // Skip before first render or if no nodes
    if (nodes.length === 0 && edges.length === 0) return;
    setHasUnsavedChanges(true);

    // Auto-save: debounce 3 seconds after last change (only if workflow already has an ID)
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    if (workflowId) {
      autoSaveTimerRef.current = setTimeout(async () => {
        try {
          const workflowData = {
            name: workflowName,
            description: "",
            workflow: {
              nodes: nodes.map((n) => ({
                id: n.id,
                type: n.type,
                position: n.position,
                data: n.data,
              })),
              edges: edges.map((e) => ({
                id: e.id,
                source: e.source,
                target: e.target,
                sourceHandle: e.sourceHandle,
              })),
            },
          };
          const response = await fetch(`/api/workflows/${workflowId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(workflowData),
          });
          if (response.ok) {
            setHasUnsavedChanges(false);
          }
        } catch {
          // Silent fail for auto-save — don't disrupt the user
        }
      }, 3000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [nodes, edges, workflowName, workflowId]);

  // ──── Poll for execution status ────
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

  // ──── Run workflow ────
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
 sourceHandle: edge.sourceHandle || undefined,
 })),
      };

      if (workflowDefinition.nodes.length === 0) {
        setWorkflowStatus("failed");
        setStatusMessage("Error: Workflow is empty. Please add nodes.");
        setIsExecuting(false);
        return;
      }

    const response = await fetch("/api/workflows/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workflow: workflowDefinition,
        workflowName,
        workflowId,
      }),
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

  // ──── Download output ────
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

  // ──── Load template ────
  const loadTemplate = (workflow: any) => {
    setNodes(
      workflow.nodes.map((node: any) => ({
        ...node,
        data: node.data,
      }))
    );
    setEdges(
      workflow.edges.map((edge: any) => ({
        ...edge,
        type: edge.type || "default",
      }))
    );
    setWorkflowName(`Template: ${new Date().toLocaleDateString()}`);
    setWorkflowId(null);
    setHasUnsavedChanges(false);
    fitView({ padding: 0.3, duration: 300 });
  };

  // ──── Prompt-to-Workflow generation ────
  const handleGenerate = async (prompt: string) => {
    const userMsg: PromptMessage = {
      role: "user",
      content: prompt,
      timestamp: new Date().toISOString(),
    };
    setPromptMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/workflows/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          current_workflow:
            nodes.length > 0
              ? {
                  nodes: nodes.map((n) => ({
                    id: n.id,
                    type: n.type,
                    position: n.position,
                    data: n.data,
                  })),
                  edges: edges.map((e) => ({
                    id: e.id,
                    source: e.source,
                    target: e.target,
                    sourceHandle: e.sourceHandle || undefined,
                  })),
                }
              : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Generation failed");
      }

      const data = await response.json();

      if (data.workflow?.nodes) {
        setNodes(
          data.workflow.nodes.map((node: any) => ({
            ...node,
            data: node.data,
          }))
        );
      }
      if (data.workflow?.edges) {
        setEdges(
          data.workflow.edges.map((edge: any) => ({
            ...edge,
            type: edge.type || "default",
          }))
        );
      }

      const assistantMsg: PromptMessage = {
        role: "assistant",
        content: data.explanation || "Workflow generated successfully.",
        timestamp: new Date().toISOString(),
      };
      setPromptMessages((prev) => [...prev, assistantMsg]);

      setTimeout(() => fitView({ padding: 0.3, duration: 300 }), 100);
    } catch (error) {
      const errorMsg: PromptMessage = {
        role: "assistant",
        content: `Error: ${
          error instanceof Error ? error.message : "Unknown error occurred"
        }`,
        timestamp: new Date().toISOString(),
      };
      setPromptMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  // ──── Save workflow ────
  const handleSaveClick = () => {
    setShowSaveModal(true);
  };

  const saveWorkflow = async (name: string, description: string) => {
    setIsSaving(true);
    try {
      const workflowData = {
        name,
        description,
        workflow: {
          nodes: nodes.map((n) => ({
            id: n.id,
            type: n.type,
            position: n.position,
            data: n.data,
          })),
          edges: edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
          })),
        },
      };

      let response: Response;
      if (workflowId) {
        // Update existing workflow
        response = await fetch(`/api/workflows/${workflowId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(workflowData),
        });
      } else {
        // Save new workflow
        response = await fetch("/api/workflows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(workflowData),
        });
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save workflow");
      }

      const saved = await response.json();
      setWorkflowName(name);
      // Capture workflow ID from save response
      if (saved.workflowId) {
        setWorkflowId(saved.workflowId);
      }
      setHasUnsavedChanges(false);
      setShowSaveModal(false);
    } catch (error) {
      console.error("Save error:", error);
      alert(
        `Failed to save workflow: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ──── Load workflow ────
  const loadWorkflow = async (wfId: string, name: string) => {
    try {
      const response = await fetch(`/api/workflows/${wfId}`);
      if (!response.ok) throw new Error("Failed to load workflow");

      const data = await response.json();
      if (data.nodes) {
        setNodes(
          data.nodes.map((node: any) => ({
            ...node,
            data: node.data,
          }))
        );
      }
      if (data.edges) {
        setEdges(
          data.edges.map((edge: any) => ({
            ...edge,
            type: edge.type || "default",
          }))
        );
      }
      setWorkflowName(name);
      setWorkflowId(wfId);
      setHasUnsavedChanges(false);
      // Note: Removed fitView to preserve user's zoom level
    } catch (error) {
      console.error("Load error:", error);
      alert(
        `Failed to load workflow: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <div className="flex w-full h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Left Sidebar Rail */}
      <LeftSidebar
        onSave={handleSaveClick}
        onOpen={() => setShowWorkflowBrowser(true)}
 onHistory={() => setShowHistoryPanel(true)}
 onTemplates={() => setShowTemplateLibrary(true)}
 isExpanded={sidebarExpanded}
 onToggleExpand={() => setSidebarExpanded(!sidebarExpanded)}
        showSettingsMenu={showSettingsMenu}
        setShowSettingsMenu={setShowSettingsMenu}
        theme={theme || "light"}
        setTheme={setTheme}
        availableModels={AVAILABLE_MODELS.map(
          (m) => MODEL_LABELS[m] || m
        )}
        selectedModel={MODEL_LABELS[selectedModel] || selectedModel}
        onModelChange={(label) => {
          const key = Object.entries(MODEL_LABELS).find(
            ([, v]) => v === label
          );
          if (key) setSelectedModel(key[0]);
        }}
        showMiniMap={showMiniMap}
        setShowMiniMap={setShowMiniMap}
      />

      {/* Main Content Area — vertically split with draggable divider */}
      <div ref={containerRef} className="flex flex-col flex-1 min-w-0">

        {/* Top: Chat Panel (resizable height) */}
        <div style={{ height: chatPanelHeight }} className="min-h-0 overflow-hidden">
          <ChatPanel
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            messages={promptMessages}
          />
        </div>

        {/* Draggable splitter bar */}
        <div
          onMouseDown={handleSplitterMouseDown}
          className="flex-shrink-0 h-2 bg-gray-200 dark:bg-gray-700 hover:bg-teal-400 dark:hover:bg-teal-600 cursor-row-resize transition-colors flex items-center justify-center group"
          title="Drag to resize"
        >
          <div className="w-8 h-1 rounded-full bg-gray-400 dark:bg-gray-500 group-hover:bg-white transition-colors" />
        </div>

        {/* Bottom: ReactFlow Canvas + Node Library */}
        <div className="flex flex-col flex-1 min-h-0">
      {/* Workflow name bar + status */}
      <div className="flex items-center gap-3 px-4 py-1.5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          className="px-2 py-0.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
        {hasUnsavedChanges && (
          <span className="w-2 h-2 rounded-full bg-amber-400" title="Unsaved changes" />
        )}
        {/* Run button */}
        <button
          onClick={runWorkflow}
          disabled={isExecuting || nodes.length === 0}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Run workflow"
        >
          <Play size={12} fill="currentColor" />
          {isExecuting ? "Running..." : "Run"}
        </button>
        {/* Save button (quick save — uses existing workflowId or opens modal) */}
        {workflowId && (
          <button
            onClick={() => saveWorkflow(workflowName, "")}
            disabled={!hasUnsavedChanges || isSaving}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title={hasUnsavedChanges ? "Save changes" : "No changes"}
          >
            <Save size={12} />
          </button>
        )}
 {/* Zoom controls */}
 <div className="flex items-center gap-1 ml-auto">
 <button
 onClick={zoomOutAction}
 className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
 title="Zoom Out"
 >
 <ZoomOut size={16} />
 </button>
 <input
 type="text"
 value={zoomInputValue}
 onChange={(e) => setZoomInputValue(e.target.value)}
 onBlur={applyZoomInput}
 onKeyDown={(e) => { if (e.key === "Enter") applyZoomInput(); }}
 className="w-10 text-xs font-mono text-center text-gray-500 dark:text-gray-400 bg-transparent border border-gray-200 dark:border-gray-700 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
 />
 <button
 onClick={zoomInAction}
 className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
 title="Zoom In"
 >
 <ZoomIn size={16} />
 </button>
 </div>
 {workflowStatus !== "idle" && (
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
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {statusMessage}
                </span>
                {workflowStatus === "processing" && (
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-teal-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
                {workflowStatus === "completed" && (
                  <button
                    onClick={downloadOutput}
                    className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400"
                  >
                    Download Output
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Canvas */}
          <div className="flex-1 min-h-0" ref={reactFlowWrapper}>
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
 defaultViewport={{ x: 0, y: 0, zoom: 1 }}
 >
              <Background
                color="#e5e7eb"
                gap={20}
                className="dark:opacity-20"
              />
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
          </div>

          {/* Node Library — collapsible bottom panel */}
          <NodeLibrary
            isExpanded={nodeLibraryExpanded}
            onToggle={() => setNodeLibraryExpanded(!nodeLibraryExpanded)}
          />
        </div>
      </div>

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

 {/* Save Workflow Modal */}
 <SaveWorkflowModal
 isOpen={showSaveModal}
 onClose={() => setShowSaveModal(false)}
 onSave={saveWorkflow}
 defaultName={workflowName}
 isSaving={isSaving}
 />

 {/* Workflow Browser Modal */}
 <WorkflowBrowser
 isOpen={showWorkflowBrowser}
 onClose={() => setShowWorkflowBrowser(false)}
 onLoadWorkflow={loadWorkflow}
 />
 </div>
  );
};

export default WorkflowCanvas;
