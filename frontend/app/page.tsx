"use client";
import dynamic from "next/dynamic";

const WorkflowCanvas = dynamic(
  () => import("./components/workflow/WorkflowCanvas"),
  { ssr: false }
);

export default WorkflowCanvas;
