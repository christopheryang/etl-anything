import { NextRequest, NextResponse } from "next/server";

// GET /api/workflows/[id] - load a specific workflow
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const response = await fetch(`${backendUrl}/api/workflows/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
      }
      throw new Error(`Backend error: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error loading workflow:", error);
    return NextResponse.json(
      { error: "Failed to load workflow" },
      { status: 500 }
    );
  }
}

// DELETE /api/workflows/[id] - delete a workflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const response = await fetch(`${backendUrl}/api/workflows/${id}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
      }
      throw new Error(`Backend error: ${response.status}`);
    }
    
    return NextResponse.json({ message: "Workflow deleted" });
  } catch (error) {
    console.error("Error deleting workflow:", error);
    return NextResponse.json(
      { error: "Failed to delete workflow" },
      { status: 500 }
    );
  }
}