"use client";
import { useRouter } from "next/navigation";
import CustomButton from "./CustomButton";
import toast from "react-hot-toast";
import { addLog } from "@/app/lib/activityLog";
import { apiFetch } from "@/app/lib/apiFetch";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await apiFetch("/api/logout", {
        method: "GET",
      });

      if (res.ok) {
        const username = localStorage.getItem("username") || "Unknown User";

        addLog({
          action: "User Logout",
          entityId: username,
        });

        localStorage.removeItem("username");

        toast.success("Logged out successfully 👋");

        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 800);
      } else {
        const errorText = await res.text();
        console.error("Logout failed:", res.status, errorText);
        toast.error("Logout failed. Please try again.");
      }
    } catch (err) {
      console.error("Logout error:", err);
      toast.error("Logout failed due to a network error.");
    }
  };

  return (
    <div className="ml-auto">
      <CustomButton buttonname="Logout" color="gray" onclick={handleLogout} />
    </div>
  );
}
