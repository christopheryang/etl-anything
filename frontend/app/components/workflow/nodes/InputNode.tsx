import React, { useState, useEffect } from "react";
import { Handle, Position, NodeProps, useReactFlow } from "reactflow";
import {
  Upload,
  Cloud,
  Database,
  Settings,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { InputNodeData } from "../../types/workflow";

export const InputNode: React.FC<NodeProps<InputNodeData>> = ({
  data,
  selected,
  id,
}) => {
  const { deleteElements } = useReactFlow();
  const [showConfig, setShowConfig] = useState(false);
  const [sourceType, setSourceType] = useState(data.sourceType || "upload");
  const [path, setPath] = useState(data.path || "");
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(data.fileName || "");

  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  const fetchFiles = async () => {
    setLoadingFiles(true);
    try {
      const response = await fetch("/api/files");
      const responseData = await response.json();
      setAvailableFiles(responseData.files || []);
    } catch (error) {
      console.error("Error fetching files:", error);
      setAvailableFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (sourceType === "upload") {
      fetchFiles();
    }
  }, [sourceType]);

  const handleFileSelect = (filename: string) => {
    // Update node data directly (React Flow will handle state)
    data.fileId = filename;
    data.fileName = filename;
    // Update local state to trigger re-render
    setSelectedFile(filename);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();

      // Update node data with uploaded file info
      data.fileId = result.file_id;
      data.fileName = result.original_filename;

      // Update local state to trigger re-render
      setSelectedFile(result.original_filename);

      // Refresh file list
      await fetchFiles();
    } catch (error) {
      console.error("File upload error:", error);
      alert(
        `Upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={`relative px-4 py-3 rounded-lg border-2 ${
        selected ? "border-teal-500" : "border-gray-300"
      } bg-white shadow-lg min-w-[200px]`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {sourceType === "drive" && (
            <Cloud className="w-4 h-4 text-teal-600" />
          )}
          {sourceType === "s3" && (
            <Database className="w-4 h-4 text-teal-600" />
          )}
          {sourceType === "upload" && (
            <Upload className="w-4 h-4 text-teal-600" />
          )}
          <span className="font-semibold text-sm">Input Node</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Delete node"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showConfig && (
        <div
          className="mt-2 p-2 bg-gray-50 rounded nodrag"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <label className="text-xs font-medium text-gray-700">
            Source Type:
          </label>
          <select
            className="w-full mt-1 text-xs border rounded px-2 py-1 nodrag"
            value={sourceType}
            onChange={(e) =>
              setSourceType(e.target.value as "upload" | "drive" | "s3")
            }
            onMouseDown={(e) => e.stopPropagation()}
          >
            <option value="upload">Manual Upload</option>
            <option value="drive">Google Drive</option>
            <option value="s3">AWS S3</option>
          </select>
          {sourceType === "upload" && (
            <div className="mt-2">
              <label className="text-xs font-medium text-gray-700 block mb-1">
                Upload File:
              </label>
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="w-full text-xs border rounded px-2 py-1 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 nodrag"
                accept=".pdf,.txt,.md,.csv,.json"
                onMouseDown={(e) => e.stopPropagation()}
              />
              {uploading && (
                <p className="text-xs text-teal-600 mt-1">Uploading...</p>
              )}

              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-700">
                    Or select from uploads:
                  </label>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchFiles();
                    }}
                    className="text-teal-600 hover:text-teal-700"
                    title="Refresh file list"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${
                        loadingFiles ? "animate-spin" : ""
                      }`}
                    />
                  </button>
                </div>
                <select
                  className="w-full text-xs border rounded px-2 py-1 nodrag"
                  value={data.fileId || ""}
                  onChange={(e) => handleFileSelect(e.target.value)}
                  disabled={loadingFiles}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <option value="">
                    {loadingFiles
                      ? "Loading files..."
                      : availableFiles.length === 0
                      ? "No files in uploads folder"
                      : "Choose a file..."}
                  </option>
                  {availableFiles.map((file) => (
                    <option key={file} value={file}>
                      {file}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {sourceType !== "upload" && (
            <input
              type="text"
              placeholder="Path/URL"
              className="w-full mt-2 text-xs border rounded px-2 py-1 nodrag"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}

      <div className="text-xs text-gray-600 mt-1">
        {selectedFile
          ? `📄 ${selectedFile}`
          : data.label || "Configure input source"}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-teal-500"
      />
    </div>
  );
};
