import { NextRequest, NextResponse } from "next/server";

// FastAPI backend URL
const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

/**
 * GET /api/executions/[id]/status
 * Get the status of a workflow execution
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: executionId } = await params;

    if (!executionId) {
      return NextResponse.json(
        { error: "Execution ID is required" },
        { status: 400 }
      );
    }

    // Forward to FastAPI backend
    const response = await fetch(
      `${FASTAPI_URL}/api/executions/${executionId}/status`
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        {
          error: errorData.detail || "Failed to get execution status",
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Status polling error:", error);
    return NextResponse.json(
      {
        error: "Failed to poll execution status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

