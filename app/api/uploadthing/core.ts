import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const fileRouter = {
  fileUploader: f({
    "text/csv": { maxFileSize: "16MB" },
    "application/vnd.ms-excel": { maxFileSize: "16MB" },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
      maxFileSize: "16MB",
    },
  })
    .middleware(() => {
      return {};
    })
    .onUploadComplete(({ file }) => {
      console.log("File uploaded:", file.ufsUrl);
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof fileRouter;