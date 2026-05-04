// Type Definitions
export interface NodeData {
  label?: string;
}

export interface InputNodeData extends NodeData {
  sourceType?: "upload" | "drive" | "s3";
  path?: string;
  fileId?: string;
  fileName?: string;
}

export interface ReasoningNodeData extends NodeData {
  prompt?: string;
  model?: "claude-haiku-4-5";
  temperature?: number;
}

export interface RuleCondition {
  variable: string;
  operator: string;
  value: string;
}

export interface RuleNodeData extends NodeData {
  conditions?: RuleCondition[];
  logic?: "AND" | "OR";
}

export interface OutputNodeData extends NodeData {
  fileName?: string;
  format?: "txt" | "json" | "md";
}

