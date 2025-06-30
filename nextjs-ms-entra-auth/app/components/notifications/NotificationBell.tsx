// components/notifications/NotificationBell.tsx
"use client";

import { useState, useEffect } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import { Badge } from "../ui/Badge";
import NotificationList from "./NotificationList";
import { useAuth } from "@/app/context/AuthContext";

export default function NotificationBell() {
    const { user, isLoading } = useAuth();
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setUnreadCount(0); 
    }
  }, [user]);

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <BellIcon className="h-6 w-6" aria-hidden="true" />
        {unreadCount > 0 && (
          <Badge
            variant="danger"
            className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5"
          >
            {unreadCount}
          </Badge>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg overflow-hidden z-50">
          {/* <NotificationList onClose={() => setShowNotifications(false)} /> */}
        </div>
      )}
    </div>
  );
}