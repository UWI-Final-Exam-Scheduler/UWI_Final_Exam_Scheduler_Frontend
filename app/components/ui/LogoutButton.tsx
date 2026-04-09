"use client";
import { useRouter } from "next/navigation";
import { Button } from "@radix-ui/themes";
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
    <Button
      type="button"
      onClick={handleLogout}
      variant="solid"
      color="gray"
      radius="large"
      size="2"
      className="font-bold"
      style={{ cursor: "pointer" }}
    >
      Logout
    </Button>
  );
}
