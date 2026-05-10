import { NextResponse } from "next/server";

/**
 * GET /api/templates
 * Return user-saved workflow templates (currently empty)
 */
export async function GET() {
  // User templates are not yet implemented
  return NextResponse.json([]);
}
