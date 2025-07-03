"use client";
import { useState } from "react";
import { Button } from "./ui/Button";

function LoginButton() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    setIsLoading(true);
    // Redirect to backend auth endpoint
    window.location.href = 'http://localhost:3001/auth/microsoft';
    setIsLoading(false);
  };

  return (
    <Button
      onClick={handleLogin}
      variant="microsoft"
      className="w-full p-3"
      isLoading={isLoading}
    >
      Login With Microsoft
    </Button>
  );
}

export default LoginButton;