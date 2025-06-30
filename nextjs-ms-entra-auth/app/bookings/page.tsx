// app/bookings/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Slot, SlotStatus } from "@/app/types/booking";
import { getUserSlots } from "../services/slotService";
import { useAuth } from "../context/AuthContext";

type BookingTab = "on-hold" | "booked" | "failed" | "cancelled";

export default function BookingsPage() {
    const { user, isLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<BookingTab>("on-hold");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserSlots = useCallback(async () => {
    try {
      setLoading(true);
      const email = user?.email;
      if (!email) return;

      const userSlots = await getUserSlots(email);
      
      const filteredSlots = userSlots.filter(slot => {
        switch (activeTab) {
          case "on-hold":
            return slot.slotStatus === "on-hold";
          case "booked":
            return slot.slotStatus === "booked";
          case "failed":
            return slot.slotStatus === "failed";
          case "cancelled":
            return slot.slotStatus === "slot cancelled";
          default:
            return false;
        }
      });

      setSlots(filteredSlots);
    } catch (error) {
      console.error('Error fetching user slots:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, user?.email]);

  useEffect(() => {
    fetchUserSlots();
  }, [fetchUserSlots]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-72 bg-white p-6 border-r border-gray-200 shadow-sm">
        <h1 className="text-2xl font-bold mb-8 text-gray-800">My Bookings</h1>
        <nav className="space-y-1">
          <button
            onClick={() => setActiveTab("on-hold")}
            className={`w-full text-left p-3 rounded-lg transition-all ${
              activeTab === "on-hold" 
                ? 'bg-blue-50 text-blue-600 font-medium border-l-4 border-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            On Hold
          </button>
          <button
            onClick={() => setActiveTab("booked")}
            className={`w-full text-left p-3 rounded-lg transition-all ${
              activeTab === "booked" 
                ? 'bg-blue-50 text-blue-600 font-medium border-l-4 border-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Booked
          </button>
          <button
            onClick={() => setActiveTab("failed")}
            className={`w-full text-left p-3 rounded-lg transition-all ${
              activeTab === "failed" 
                ? 'bg-blue-50 text-blue-600 font-medium border-l-4 border-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Failed
          </button>
          <button
            onClick={() => setActiveTab("cancelled")}
            className={`w-full text-left p-3 rounded-lg transition-all ${
              activeTab === "cancelled" 
                ? 'bg-blue-50 text-blue-600 font-medium border-l-4 border-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Cancelled
          </button>
        </nav>
      </div>

      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800 capitalize">
              {activeTab === "on-hold" ? "On Hold" : activeTab} Slots
            </h2>
            <span className="px-3 py-1 bg-white text-sm text-gray-600 rounded-full border border-gray-200">
              {slots.length} {slots.length === 1 ? 'slot' : 'slots'}
            </span>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : slots.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
              <svg
                className="w-16 h-16 mx-auto text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                ></path>
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-700">
                No {activeTab} slots found
              </h3>
              <p className="mt-2 text-gray-500">
                You don't have any {activeTab === "on-hold" ? "on hold" : activeTab} slots at the moment.
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              {slots.map(slot => (
                <div 
                  key={slot.slotId} 
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">
                        {slot.startTime} - {slot.endTime}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">Game ID: {slot.gameId}</p>
                      {slot.heldBy === user?.email ? (
                        <p className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block mt-2">
                          You booked this slot
                        </p>
                      ) : (
                        <p className="text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded-full inline-block mt-2">
                          You're participating in this slot
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                      slot.slotStatus === "booked" ? "bg-green-50 text-green-600" :
                      slot.slotStatus === "on-hold" ? "bg-yellow-50 text-yellow-600" :
                      slot.slotStatus === "slot cancelled" ? "bg-gray-100 text-gray-600" :
                      "bg-red-50 text-red-600"
                    }`}>
                      {slot.slotStatus === "slot cancelled" ? "cancelled" : slot.slotStatus}
                    </span>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">
                          Participants: {slot.peopleAccepted}/{slot.peopleAdded}
                        </h4>
                        {slot.createdAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Created: {new Date(slot.createdAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      {slot.updatedAt && slot.slotStatus === "slot cancelled" && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            Cancelled: {new Date(slot.updatedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}