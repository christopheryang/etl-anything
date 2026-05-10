import { NextRequest, NextResponse } from "next/server";

// FastAPI backend URL
const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8001";

/**
 * POST /api/executions/[id]/replay
 * Replay a workflow execution with the same inputs
 */
export async function POST(
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

    const response = await fetch(
      `${FASTAPI_URL}/api/executions/${executionId}/replay`,
      { method: "POST" }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || "Failed to replay execution" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Replay execution error:", error);
    return NextResponse.json(
      { error: "Failed to replay execution" },
      { status: 500 }
    );
  }
}
