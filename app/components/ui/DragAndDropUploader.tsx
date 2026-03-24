"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import type { FileRejection } from "react-dropzone";

export default function DragAndDropUploader() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async (file: File) => {
    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL_LOCAL}/api/upload`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload Failed");
      }

      setMessage(`${data.message}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage(`${err.message}`);
      } else {
        setMessage("An unexpected error occured");
      }
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (acceptedFiles.length > 0) {
        handleUpload(acceptedFiles[0]);
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
