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
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="hidden md:block md:col-span-1 p-4">
          {" "}
          <Sidebar />
        </div>
        <div className="col-span-3 p-4"> {children}</div>
        <div className="hidden md:block md:col-span-1 p-4"></div>
      </div>
    </div>
  );
}
