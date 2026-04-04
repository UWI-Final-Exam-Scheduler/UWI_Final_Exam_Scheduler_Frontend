import type { ReactNode } from "react";
import Sidebar from "../components/ui/Sidebar";
import Image from "next/image";
import React, { Suspense } from "react";
import LogoutButton from "../components/ui/LogoutButton";

export default function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div>
      <header className="p-4 flex items-center gap-4">
        <Image
          src="/uwiLogo.png"
          alt="UWI Logo"
          width={48}
          height={48}
          className="object-contain mr-4"
        />
        <h1 className="text-xl font-bold">Exam Scheduler</h1>
        <LogoutButton />
      </header>
      <div className="min-h-screen flex flex-row p-4 gap-4">
        <Sidebar />
        <Suspense fallback={<div>Loading...</div>}>
          <main className="flex-1 p-4">{children}</main>
        </Suspense>
      </div>
    </div>
  );
}
