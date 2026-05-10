import { NextRequest, NextResponse } from "next/server";

// FastAPI backend URL
const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8001";

/**
 * GET /api/executions/[id]/detail
 * Get detailed execution record
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

    const response = await fetch(
      `${FASTAPI_URL}/api/executions/${executionId}/detail`
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || "Failed to fetch execution detail" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Fetch execution detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch execution detail" },
      { status: 500 }
    );
  }
}
