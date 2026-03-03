"use client";

import { useState } from "react";
import CustomButton from "../components/ui/CustomButton";
import CustomTextField from "../components/ui/CustomTextField";
import LoginCard from "../components/ui/LoginCard";

type FieldErrors = {
  username?: string;
  password?: string;
};

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const errors: FieldErrors = {};

    if (!username.trim()) {
      errors.username = "Username is required";
    }

    if (!password) {
      errors.password = "Password is required";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      const baseUrl = (
        process.env.NEXT_PUBLIC_API_BASE_URL_LOCAL || ""
      ).replace(/\/$/, "");

      const res = await fetch(
        `${baseUrl}/api/auth/login`, //using local for development, change to production URL when deploying
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
          credentials: "include", // include cookies for session management
        },
      );

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        console.error("Login failed:", data);
        setError(data.error || data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error when attempting to login");
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

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>
      </LoginCard>
    </div>
  );
}
