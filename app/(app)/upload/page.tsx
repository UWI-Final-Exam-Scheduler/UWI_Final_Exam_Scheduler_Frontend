"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import DragAndDropUploader from "@/app/components/ui/DragAndDropUploader";
import { addLog } from "@/app/lib/activityLog";
import { apiFetch } from "@/app/lib/apiFetch";

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async (file: File) => {
    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await res.json()
        : { error: await res.text() };

      if (!res.ok) {
        throw new Error(data.error || "Upload Failed");
      }

      addLog({
        action: "File Upload",
        entityId: file.name,
      });

      toast.success(`${file.name} uploaded successfully 📁`);

      setMessage(
        typeof data.message === "string"
          ? data.message
          : "Upload completed successfully.",
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage(`${err.message}`);
      } else {
        setMessage("An unexpected error occurred");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10">
      <h1 className="text-2xl font-semibold mb-6">Upload Dataset</h1>
      <DragAndDropUploader
        uploading={uploading}
        message={message}
        onFileSelect={handleUpload}
      />
    </div>
  );
}
