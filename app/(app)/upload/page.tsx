"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import DragAndDropUploader from "@/app/components/ui/DragAndDropUploader";
import { addLog } from "@/app/lib/activityLog";

type UploadResponse = {
  message?: string;
  error?: string;
};

export default function UploadPage() {
  const uploadRequestRef = useRef<XMLHttpRequest | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);

  const uploadWithProgress = (formData: FormData) =>
    new Promise<{ status: number; data: UploadResponse }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      uploadRequestRef.current = xhr;

      xhr.open("POST", "/api/upload");
      xhr.withCredentials = true;

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) {
          return;
        }

        const percent = Math.round((event.loaded / event.total) * 100);
        setProgress(Math.min(Math.max(percent, 0), 100));

        if (percent >= 100) {
          setProcessing(true);
        }
      };

      xhr.onload = () => {
        uploadRequestRef.current = null;
        const contentType = xhr.getResponseHeader("content-type") || "";
        const responseText = xhr.responseText || "";

        let data: UploadResponse = {};
        if (contentType.includes("application/json")) {
          try {
            data = JSON.parse(responseText) as UploadResponse;
          } catch {
            data = { error: "Invalid JSON response from server." };
          }
        } else if (responseText) {
          data = { error: responseText };
        }

        resolve({ status: xhr.status, data });
      };

      xhr.onerror = () => {
        uploadRequestRef.current = null;
        reject(new Error("Network error while uploading file."));
      };

      xhr.onabort = () => {
        uploadRequestRef.current = null;
        reject(new Error("Upload was canceled."));
      };

      xhr.send(formData);
    });

  const handleUpload = async (file: File) => {
    setUploading(true);
    setProcessing(false);
    setMessage("");
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { status, data } = await uploadWithProgress(formData);

      if (status < 200 || status >= 300) {
        throw new Error(data.error || "Upload Failed");
      }

      setProgress(100);
      setProcessing(false);

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
      setProcessing(false);
      if (err instanceof Error) {
        setMessage(`${err.message}`);
      } else {
        setMessage("An unexpected error occurred");
      }
    } finally {
      uploadRequestRef.current = null;
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    if (!uploading) {
      return;
    }

    uploadRequestRef.current?.abort();
    setProcessing(false);
    setUploading(false);
    setProgress(0);
    setMessage("Upload canceled.");
    toast("Upload canceled.");
  };

  return (
    <div className="max-w-xl mx-auto mt-10">
      <h1 className="text-2xl font-semibold mb-6">Upload Dataset</h1>
      <DragAndDropUploader
        uploading={uploading}
        processing={processing}
        progress={progress}
        message={message}
        onFileSelect={handleUpload}
        onCancelUpload={cancelUpload}
      />

      <section className="mt-6 rounded-lg border border-blue-100 bg-blue-50/60 p-4">
        <h2 className="text-sm font-semibold text-blue-900">Upload Guide</h2>
        <p className="mt-2 text-sm text-blue-900">
          Note: Documents must include a relevant keyword in the filename. For
          example, a course listing file should be named{" "}
          <strong>Courses.csv</strong>, and a past timetable file should be
          named <strong>UWI Timetable Cross Reference.pdf</strong>.
        </p>

        <div className="mt-3">
          <p className="text-sm font-medium text-blue-900">
            Recommended upload order:
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-blue-900">
            <li>Venues.csv</li>
            <li>Courses.csv</li>
            <li>Students.csv</li>
            <li>UWI Timetable Cross Reference.pdf</li>
            <li>Enrollments.csv</li>
          </ol>
        </div>
      </section>
    </div>
  );
}
