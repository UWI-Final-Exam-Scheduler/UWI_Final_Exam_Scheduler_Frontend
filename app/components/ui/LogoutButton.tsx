"use client";
import { useRouter } from "next/navigation";
import CustomButton from "./CustomButton";
import toast from "react-hot-toast";
import { addLog } from "@/app/lib/activityLog"

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
        const username = localStorage.getItem("username") || "Unknown User";

        addLog({
          action: "User Logout",
          entityId: username, 
        })

        localStorage.removeItem("username");

        toast.success("Logged out successfully 👋");

        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 800);
      } else {
        console.error("Logout failed");
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <div className="ml-auto">
      <CustomButton
        buttonname="Logout"
        color="gray"
        onclick={handleLogout}
      />
    </div>
  );
}