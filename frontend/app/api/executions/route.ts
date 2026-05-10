import { NextRequest, NextResponse } from "next/server";

// FastAPI backend URL
const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8001";

/**
 * GET /api/executions
 * List execution history records
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflowId");
    const limit = searchParams.get("limit");

    const params = new URLSearchParams();
    if (workflowId) params.set("workflowId", workflowId);
    if (limit) params.set("limit", limit);

    const response = await fetch(
      `${FASTAPI_URL}/api/executions?${params.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || "Failed to fetch executions" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Fetch executions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch execution history" },
      { status: 500 }
    );
  }
}
