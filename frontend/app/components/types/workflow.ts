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
  model?: 
    | "haiku-4.5" 
    | "sonnet-4.7" 
    | "opus-4.7"
    | "qwen/qwen3.5-397b-a17b"
    | "minimax/minimax-m2.7"
    | "thudm/glm-4.7";
  temperature?: number;
  system_prompt?: string;
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
 format?: "txt" | "json" | "md" | "csv";
}

export interface PromptMessage {
 role: "user" | "assistant";
 content: string;
 timestamp: string;
}

