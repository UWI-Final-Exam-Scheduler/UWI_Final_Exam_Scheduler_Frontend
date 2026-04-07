"use client";

import { useDropzone } from "react-dropzone";

type DragAndDropUploaderProps = {
  uploading: boolean;
  message: string;
  onFileSelect: (file: File) => void;
};

export default function DragAndDropUploader({
  uploading,
  message,
  onFileSelect,
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
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
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
          <p className="text-blue-600 font-medium">Uploading...</p>
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
