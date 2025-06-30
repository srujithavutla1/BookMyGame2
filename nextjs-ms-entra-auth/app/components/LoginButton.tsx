// components/LoginButton.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

function LoginButton() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleLogin = async () => {
    setIsLoading(true);
    // Redirect to backend auth endpoint
    window.location.href = 'http://localhost:3001/auth/microsoft';
    setIsLoading(false);
  };

  return (
    <button
      onClick={handleLogin}
      className="w-full bg-blue-800 text-white my-5 p-3 rounded-md hover:opacity-80 disabled:opacity-75"
      disabled={isLoading}
    >
      {isLoading ? "Signing in..." : "Login With Microsoft"}
    </button>
  );
}

export default LoginButton;