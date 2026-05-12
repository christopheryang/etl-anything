import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8001";

/**
 * POST /api/workflows/generate
 * Generate or modify a workflow from a natural language prompt.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, current_workflow, model } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "A prompt string is required" },
        { status: 400 }
      );
    }

    // Forward to FastAPI backend
    const response = await fetch(`${FASTAPI_URL}/api/workflows/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
 body: JSON.stringify({
 prompt,
 current_workflow: current_workflow || null,
 model: model || "qwen/qwen3.5-397b-a17b",
 }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText };
      }

      console.error("Backend generate error:", errorData);

      return NextResponse.json(
        {
          error: errorData.detail || "Workflow generation failed",
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      explanation: data.explanation,
      workflow: data.workflow,
    });
  } catch (error) {
    console.error("Workflow generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate workflow",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
