"use client";

import DragAndDropUploader from "@/app/components/ui/DragAndDropUploader";

export default function UploadPage() {
  return (
    <div className="max-w-xl mx-auto mt-10">
      <h1 className="text-2xl font-semibold mb-6">Upload Dataset</h1>
      <DragAndDropUploader />
    </div>
  );
}