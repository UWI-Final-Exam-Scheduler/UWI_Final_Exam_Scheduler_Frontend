"use client";
import {Button} from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import CustomButton from "./CustomButton";

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
    <div className="ml-auto">
      <CustomButton
        buttonname="Logout"
        color="gray"
        onclick={handleLogout}
      />
    </div>
  );
}