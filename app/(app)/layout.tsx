import type { ReactNode } from "react";
import Sidebar from "../components/ui/Sidebar";
import Image from "next/image";
import React, { Suspense } from "react";
import LogoutButton from "../components/ui/LogoutButton";
import ExportPDFButton from "../components/ui/exportPDFButton";

export default function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div>
      <header className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Image
            src="/uwiLogo.png"
            alt="UWI Logo"
            width={48}
            height={48}
            className="object-contain"
          />
          <h1 className="text-2xl font-bold">Exam Scheduler</h1>
        </div>

        <div className="flex items-center gap-2">
          <ExportPDFButton />
          <LogoutButton />
        </div>
      </header>
      <div className="min-h-screen flex flex-row p-4 gap-4">
        <Sidebar />
        <Suspense
          fallback={
            <div className="flex items-center gap-3 p-4 text-gray-700">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              <span className="font-medium">Loading page...</span>
            </div>
          }
        >
          <main className="flex-1 p-4">{children}</main>
        </Suspense>
      </div>
    </div>
  );
}
