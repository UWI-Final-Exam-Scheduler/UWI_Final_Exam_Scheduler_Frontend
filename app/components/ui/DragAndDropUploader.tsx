"use client";

import { useDropzone } from "react-dropzone";

export default function DragAndDropUploader() {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: () => {},
    accept: {
      "text/csv": [".csv"],
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded p-8 text-center cursor-pointer transition-colors ${isDragActive ? "border-blue-600 bg-blue-50" : "border-gray-300 bg-white"}`}
    >
      <input {...getInputProps()} />
      <p className="mb-2">
        Drag & drop a CSV, PDF or Excel file here, or click to select
      </p>
      <span className="text-xs text-gray-500">
        Only .csv, .pdf or .xlsx files are supported
      </span>
    </div>
  );
}
