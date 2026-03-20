"use client";

import DragAndDropUploader from "@/app/components/ui/DragAndDropUploader";

export default function UploadPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Upload Dataset</h1>
      <DragAndDropUploader />
    </div>
  );
}


// import { UploadButton } from "@/app/components/ui/UploadButton";

// export default function UploadPage() {
//   return (
//     <div>
//       <h1 className="text-xl font-semibold mb-4">Upload Dataset</h1>
//         <UploadButton
//           endpoint="fileUploader"
//           appearance={{
//             button: "bg-blue-600 text-white px-4 py-2 rounded",
//             allowedContent: "hidden",
//           }}
//           content={{
//             button: "Upload CSV or Excel",
//           }}
//           onClientUploadComplete={(res) => {
//             console.log("Upload complete:", res);
//             alert("Upload successful!");
//           }}
//           onUploadError={(error: Error) => {
//             alert(`Upload failed: ${error.message}`);
//           }}
//         />
//     </div>
//   );
// }