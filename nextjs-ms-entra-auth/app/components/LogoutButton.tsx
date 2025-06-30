// components/LogoutButton.tsx
"use client";
import { useRouter } from "next/navigation";

function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:3001/auth/logout', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full bg-blue-800 text-white p-3 rounded-md hover:opacity-80"
    >
      Logout
    </button>
  );
}

export default LogoutButton;