import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * GET /api/templates/builtin
 * Return the built-in workflow templates
 */
export async function GET() {
  try {
    const templatesDir = path.join(process.cwd(), "templates");
    const templates: Array<Record<string, any>> = [];

    if (fs.existsSync(templatesDir)) {
      const files = fs.readdirSync(templatesDir).filter((f) => f.endsWith(".json"));

      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(templatesDir, file), "utf-8");
          templates.push(JSON.parse(content));
        } catch {
          // Skip malformed templates
        }
      }
    }

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Failed to load built-in templates:", error);
    return NextResponse.json([]);
  }
}
