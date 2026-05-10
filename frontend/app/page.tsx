"use client";
import { ReactFlowProvider } from "reactflow";
import WorkflowCanvas from "./components/workflow/WorkflowCanvas";

export default function Page() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas />
    </ReactFlowProvider>
  );
}
