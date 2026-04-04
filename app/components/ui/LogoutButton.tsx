"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const BASE_URL =
    process.env.NODE_ENV === "development"
      ? process.env.NEXT_PUBLIC_API_BASE_URL_LOCAL
      : process.env.NEXT_PUBLIC_API_BASE_URL_PROD;

  const handleLogout = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/logout`, {
        method: "GET",
        credentials: "include",
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        console.error("Logout failed");
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="ml-auto rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
    >
      Logout
    </button>
  );
}