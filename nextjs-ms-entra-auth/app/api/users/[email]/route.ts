// app/api/users/[email]/route.ts
import { NextResponse } from 'next/server';
import { User } from '@/app/types/user';

let users: User[] = []; // Initialize with your users data

export async function PATCH(request: Request, { params }: { params: { email: string } }) {
  try {
    const { change } = await request.json();
    const userIndex = users.findIndex(user => user.email === params.email);
    
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedUser = {
      ...users[userIndex],
      chances: Math.max(0, users[userIndex].chances + change),
      lastChanceUpdatedAt: new Date().toISOString()
    };

    users[userIndex] = updatedUser;
    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update user chances' },
      { status: 500 }
    );
  }
}

