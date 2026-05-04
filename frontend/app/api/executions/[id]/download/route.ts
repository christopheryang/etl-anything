import { NextRequest, NextResponse } from "next/server";

// FastAPI backend URL
const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

/**
 * GET /api/executions/[id]/download
 * Download the output file from a completed workflow execution
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
      `${FASTAPI_URL}/api/executions/${executionId}/download`
    );

    if (!response.ok) {
      // Try to parse error as JSON
      try {
        const errorData = await response.json();
        return NextResponse.json(
          {
            error: errorData.detail || "Failed to download output file",
            details: errorData,
          },
          { status: response.status }
        );
      } catch {
        return NextResponse.json(
          { error: "Failed to download output file" },
          { status: response.status }
        );
      }
    }

    // Get content type from backend response
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    let contentDisposition = response.headers.get("content-disposition");
    
    // If no content-disposition, create a default one
    if (!contentDisposition) {
      contentDisposition = `attachment; filename="output-${executionId}.txt"`;
    } else {
      // Clean up the filename if it has extra quotes
      contentDisposition = contentDisposition.replace(/filename="?"([^"]+)"?"/g, 'filename="$1"');
    }

    // Stream the file from backend to client
    const fileData = await response.arrayBuffer();

    return new NextResponse(fileData, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      {
        error: "Failed to download file",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

