"use client";

import { UploadButton } from "@/app/components/ui/UploadButton";
import CustomCard from "@/app/components/ui/CustomCard";

export default function UploadPage() {
    return (
        <div>
            <h1 className="text-xl font-semibold mb-4">Upload Dataset</h1>

            <CustomCard>
                <UploadButton
                    endpoint="fileUploader"
                    onClientUploadComplete={(res) => {
                        console.log("Upload complete:", res);
                        alert("Upload successful!");
                    }}
                    onUploadError={(error: Error) => {
                        alert(`Upload failed: ${error.message}`);
                    }}
                    className="ut-button:bg-blue-600 ut-button:text-white"
                />
            </CustomCard>
        </div>
    );
}