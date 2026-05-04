import { NextRequest, NextResponse } from "next/server";

// FastAPI backend URL - update this based on your setup
const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

/**
 * POST /api/workflows/execute
 * Submit a workflow definition for execution
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflow } = body;

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow definition is required" },
        { status: 400 }
      );
    }

    // Validate workflow structure
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      return NextResponse.json(
        { error: "Workflow must contain a nodes array" },
        { status: 400 }
      );
    }

    if (!workflow.edges || !Array.isArray(workflow.edges)) {
      return NextResponse.json(
        { error: "Workflow must contain an edges array" },
        { status: 400 }
      );
    }

    // Forward to FastAPI backend
    const response = await fetch(`${FASTAPI_URL}/api/workflows/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ workflow }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText };
      }
      
      console.error("Backend error:", errorData);
      
      return NextResponse.json(
        {
          error: errorData.detail || "Workflow execution failed",
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      execution_id: data.execution_id,
      status: data.status,
      message: data.message || "Workflow execution started",
    });
  } catch (error) {
    console.error("Workflow execution error:", error);
    return NextResponse.json(
      {
        error: "Failed to execute workflow",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

