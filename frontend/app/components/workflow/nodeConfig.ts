/**
 * Node Configuration Registry
 * 
 * Central source of truth for all workflow node types.
 * Defines how frontend nodes map to backend, their appearance, and behavior.
 */

import { Upload, Brain, GitBranch, Download, LucideIcon } from "lucide-react";

/**
 * Configuration for a single node type
 */
export interface NodeConfig {
  /** Frontend node type identifier (used in React Flow) */
  frontendType: string;
  
  /** Backend node type identifier (null if not supported by backend) */
  backendType: string | null;
  
  /** Display label for the node */
  label: string;
  
  /** Short description shown in sidebar */
  description: string;
  
  /** Lucide icon component */
  icon: LucideIcon;
  
  /** Hex color for minimap and styling */
  color: string;
  
  /** Whether to show in sidebar node library */
  showInSidebar: boolean;
  
  /** Maps frontend node data to backend-expected format */
  dataMapper: (data: Record<string, unknown>) => Record<string, unknown>;
}

/**
 * Node Configuration Registry
 * 
 * To add a new node type:
 * 1. Add entry here with all required fields
 * 2. Create the React component (e.g., MyNode.tsx)
 * 3. Register component in nodes/index.ts
 * 4. Add TypeScript interface in types/workflow.ts
 * 
 * The rest (sidebar, colors, backend mapping) is automatic!
 */
export const NODE_CONFIGS: Record<string, NodeConfig> = {
  input: {
    frontendType: "input",
    backendType: "input",
    label: "Input Node",
    description: "Data sources & uploads",
    icon: Upload,
    color: "#14b8a6",
    showInSidebar: true,
    dataMapper: (data) => ({
      fileId: data.fileId || "",
      fileName: data.fileName || "",
    }),
  },

  reasoning: {
    frontendType: "reasoning",
    backendType: "llm", // Maps to "llm" on backend
    label: "Reasoning Node",
    description: "LLM processing",
    icon: Brain,
    color: "#0891b2",
    showInSidebar: true,
    dataMapper: (data) => ({
      prompt: data.prompt || "",
      model: data.model || "claude-haiku-4-5",
      temperature: data.temperature ?? 0.7,
    }),
  },

  output: {
    frontendType: "output",
    backendType: "output",
    label: "Output Node",
    description: "Export & save data",
    icon: Download,
    color: "#dc2626",
    showInSidebar: true,
    dataMapper: (data) => ({
      fileName: data.fileName || "output.json",
      format: data.format || "json",
    }),
  },

  rule: {
    frontendType: "rule",
    backendType: null, // Not yet supported by backend
    label: "Rule Node",
    description: "Business logic",
    icon: GitBranch,
    color: "#7c3aed",
    showInSidebar: true, // Show in sidebar for UI demo (filtered from execution)
    dataMapper: (data) => data, // Not sent to backend
  },
};

/**
 * Get node configuration by frontend type
 */
export function getNodeConfig(frontendType: string): NodeConfig | undefined {
  return NODE_CONFIGS[frontendType];
}

/**
 * Get all node types that should appear in sidebar
 */
export function getSidebarNodes(): [string, NodeConfig][] {
  return Object.entries(NODE_CONFIGS).filter(
    ([, config]) => config.showInSidebar
  );
}

/**
 * Check if a node type is supported by backend
 */
export function isBackendSupported(frontendType: string): boolean {
  const config = NODE_CONFIGS[frontendType];
  return config !== undefined && config.backendType !== null;
}

