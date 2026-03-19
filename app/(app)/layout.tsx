import type { ReactNode } from "react";
import Sidebar from "../components/ui/Sidebar";
import Image from "next/image";

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
      </header>
      <div className="min-h-screen flex flex-row p-4 gap-4">
        <Sidebar />
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
