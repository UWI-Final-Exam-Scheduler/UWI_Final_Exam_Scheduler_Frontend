"use client";

import { useState } from "react";
import CustomButton from "../components/ui/CustomButton";
import CustomTextField from "../components/ui/CustomTextField";
import LoginCard from "../components/ui/LoginCard";
import { Spinner } from "@radix-ui/themes";
import toast from "react-hot-toast";
import { addLog } from "../lib/activityLog";

type FieldErrors = {
  username?: string;
  password?: string;
};

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setIsLoading(true);

    const errors: FieldErrors = {};

    if (!username.trim()) {
      errors.username = "Username is required";
    }

    if (!password) {
      errors.password = "Password is required";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/auth/login`, //using local for development, change to production URL when deploying
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
          credentials: "include", // include cookies for session management
        },
      );

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        addLog({
          action: "User Login",
          entityId: username,
        });

        toast.success("Welcome Back 👋");

        setTimeout(() => { // Sets small timeout so Notification can be seen
          window.location.href = "/dashboard";
        }, 800);
      } else {
        console.error("Login failed:", data);
        setError(data.error || data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error when attempting to login");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex justify-center">
      <LoginCard>
        <form
          onSubmit={handleLogin}
          className="flex flex-col items-center gap-4"
        >
          <CustomTextField
            placeholder="Username"
            value={username}
            size="3"
            onChange={(e) => setUsername(e.target.value)}
            className="w-full sm:w-[200px] md:w-[300px]"
          />

          {fieldErrors.username && (
            <p className="text-sm text-red-600 w-[300px]">
              {fieldErrors.username}
            </p>
          )}

          <CustomTextField
            placeholder="Password"
            type="password"
            size="3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full sm:w-[200px] md:w-[300px]"
          />

          {fieldErrors.password && (
            <p className="text-sm text-red-600 w-[300px]">
              {fieldErrors.password}
            </p>
          )}
          <div className="flex justify-center">
            <CustomButton buttonname="Login" type="submit" />
          </div>

          {isLoading && <Spinner />}
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>
      </LoginCard>
    </div>
  );
}
