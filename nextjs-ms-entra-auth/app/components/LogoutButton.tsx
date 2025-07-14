"use client";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { logout } from "../services/authService";

function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const response = await logout();
      if (response.success) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleLogout}
      variant="danger"
      className="w-full p-3"
      isLoading={isLoading}
    >
      Logout
    </Button>
  );
}

export default LogoutButton;