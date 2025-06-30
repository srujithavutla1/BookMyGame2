"use client";
import { Badge } from "../ui/Badge";
import Link from "next/link";
import { User } from "../../types/user";

interface UserStatsProps {
  currentUser: User | null;
}

export default function UserStats({ currentUser }: UserStatsProps) {
  return (
    <div className="flex gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Chances Left</h3>
        <p className="text-2xl font-bold">
          {currentUser?.chances ?? 0} <span className="text-sm font-normal">/ 3</span>
        </p>
      </div>
      <Link href="/bookings">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Today's Bookings</h3>
          <p className="text-2xl font-bold"> ................</p>
        </div>
      </Link>
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Status</h3>
        <Badge variant={(currentUser?.chances ?? 0) > 0 ? "success" : "danger"}>
          {(currentUser?.chances ?? 0) > 0 ? "Active" : "Limit Reached"}
        </Badge>
      </div>
    </div>
  );
}