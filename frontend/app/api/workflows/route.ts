import { NextRequest, NextResponse } from "next/server";

// GET /api/workflows - list saved workflows (with pagination + sorting)
export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8001";
    const searchParams = request.nextUrl.searchParams;
    const qs = searchParams.toString();
    const url = `${backendUrl}/api/workflows${qs ? `?${qs}` : ""}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching workflows:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
      { status: 500 }
    );
  }
}

// POST /api/workflows - save a workflow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const backendUrl = process.env.BACKEND_URL || "http://localhost:8001";
    const response = await fetch(`${backendUrl}/api/workflows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error saving workflow:", error);
    return NextResponse.json(
      { error: "Failed to save workflow" },
      { status: 500 }
    );
  }
}
