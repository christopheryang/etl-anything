import { NextRequest, NextResponse } from "next/server";
import { readdir, mkdir, writeFile, stat } from "fs/promises";
import { join, resolve } from "path";
import { randomUUID } from "crypto";

// Get uploads directory from environment variable or use default.
// Default points to ../backend/uploads to match the backend's UPLOADS_DIR
// when frontend/ and backend/ are siblings (the standard repo layout).
const getUploadsDir = () => {
  return process.env.UPLOADS_DIR || resolve(process.cwd(), "..", "backend", "uploads");
};

export async function GET() {
  try {
    // Use the same uploads directory as POST
    const uploadsDir = getUploadsDir();
    
    // Create directory if it doesn't exist
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch {
      // Directory might already exist
    }
    
    const files = await readdir(uploadsDir);
    
    // Filter for allowed file types
    const allowedExtensions = ['.pdf', '.txt', '.md', '.csv', '.json'];
    const filteredFiles = files.filter(file => {
      const ext = file.substring(file.lastIndexOf('.')).toLowerCase();
      return allowedExtensions.includes(ext);
    });
    
    return NextResponse.json({ files: filteredFiles });
  } catch (error) {
    console.error("Error reading uploads directory:", error);
    return NextResponse.json(
      { error: "Failed to read uploads directory", files: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['.pdf', '.txt', '.md', '.csv', '.json'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedTypes.includes(fileExt)) {
      return NextResponse.json(
        { error: `File type not supported. Allowed types: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist (at parent project level)
    const uploadsDir = getUploadsDir();
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch {
      // Directory might already exist
    }

    // Generate unique file ID with extension
    const fileId = `${randomUUID()}${fileExt}`;
    const filePath = join(uploadsDir, fileId);

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Get file size
    const fileStats = await stat(filePath);

    return NextResponse.json({
      file_id: fileId,
      original_filename: file.name,
      size: fileStats.size,
      path: `/uploads/${fileId}`
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

