import { NextRequest, NextResponse } from "next/server";

// FastAPI backend URL
const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8001";

/**
 * DELETE /api/executions/[id]/history
 * Delete an execution history record
 */
export async function DELETE(
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
      `${FASTAPI_URL}/api/executions/${executionId}/history`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || "Failed to delete execution" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Delete execution error:", error);
    return NextResponse.json(
      { error: "Failed to delete execution" },
      { status: 500 }
    );
  }
}
