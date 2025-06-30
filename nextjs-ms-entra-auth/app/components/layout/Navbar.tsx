"use client"
import Link from "next/link";
import NotificationBell from "../notifications/NotificationBell";
import LogoutButton from "../LogoutButton";
import { useAuth } from "@/app/context/AuthContext";



export default function Navbar() {
   const { user, isLoading } = useAuth();
  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-end items-center">
        <div className="flex items-center space-x-4">
          {user && (
            <>
              <Link href="invitations" className="text-gray-600 hover:text-gray-900">
                Invitations
              </Link>
              <div className="flex items-center space-x-2">
                <span className="text-gray-700">
                 
                </span>
                <LogoutButton />
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

