import type { ReactNode } from "react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div>
      <header className="p-10 bg-blue-500"></header>
      <div className="min-h-screen bg-blue-500 grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="hidden md:block md:col-span-1 p-4"></div>
        <div className="col-span-3 p-4"> {children}</div>
        <div className="hidden md:block md:col-span-1 p-4"></div>
      </div>
    </div>
  );
}
