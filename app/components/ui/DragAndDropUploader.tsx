"use client";

import { useDropzone } from "react-dropzone";

type DragAndDropUploaderProps = {
  uploading: boolean;
  processing: boolean;
  progress: number;
  message: string;
  onFileSelect: (file: File) => void;
  onCancelUpload: () => void;
};

export default function DragAndDropUploader({
  uploading,
  processing,
  progress,
  message,
  onFileSelect,
  onCancelUpload,
}: DragAndDropUploaderProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    accept: {
      "text/csv": [".csv"],
      "application/pdf": [".pdf"],
      "application/octet-stream": [".xlsx"],
    },
    multiple: false,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded p-8 text-center cursor-pointer transition-colors 
        ${isDragActive ? "border-blue-600 bg-blue-50" : "border-gray-300 bg-white"}
        ${uploading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} disabled={uploading} />
        {uploading ? (
          <div className="space-y-3">
            <p className="text-blue-600 font-medium">
              {processing
                ? "Upload complete. Importing data on server..."
                : "Uploading..."}
            </p>
            {processing ? (
              <div className="space-y-2">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-blue-600 animate-pulse" />
                </div>
                <p className="text-xs text-gray-600">
                  Server is processing your file. This may take 1-2 minutes for
                  large files.
                </p>
                <button
                  type="button"
                  onClick={onCancelUpload}
                  className="mt-2 px-3 py-1.5 text-xs font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  Cancel Upload
                </button>
              </div>
            ) : (
              <>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600">{progress}%</p>
                <button
                  type="button"
                  onClick={onCancelUpload}
                  className="mt-2 px-3 py-1.5 text-xs font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  Cancel Upload
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <p className="mb-2">
              Drag & drop a CSV, PDF or Excel file here, or click to select
            </p>
            <span className="text-xs text-gray-500">
              Only .csv, .pdf or .xlsx files are supported
            </span>
          </>
        )}
      </div>

      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
}
