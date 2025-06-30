
export interface User {
  userId: string;
  name: string;
  email: string;
  chances: number;
  lastChanceUpdatedAt:string;
}

export interface UserActivity {
  type: "booking" | "invitation" | "participation";
  status: "confirmed" | "pending" | "cancelled" | "failed";
  gameId: string;
  slotId: string;
  date: string;
  time: string; // HH:MM format
  participants?: User[];
  timestamp: string; 
}


export interface UserNotification {
  id: string;
  type: "invitation" | "booking-update" | "system";
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  relatedId?: string;
}