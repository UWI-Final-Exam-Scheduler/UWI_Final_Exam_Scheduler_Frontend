import type { ReactNode } from "react";
import Sidebar from "../components/ui/Sidebar";

export default function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div>
      <header className="p-4">
        <h1 className="text-xl font-bold">Exam Scheduler</h1>
      </header>
      <div className="min-h-screen md:grid md:grid-cols-5">
        <div className="hidden md:block md:col-span-1">
          <Sidebar />
        </div>
        <main className="md:col-span-4 p-4">{children}</main>
      </div>
    </div>
  );
}
