import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { Slot } from '@/app/types/booking';

const dataPath = path.join(process.cwd(), 'data');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slotId = searchParams.get('slotId');
    const email = searchParams.get('email');
    const filePath = path.join(dataPath, 'slots.json');
    const data = await fs.readFile(filePath, 'utf-8');
    let slots: Slot[] = JSON.parse(data);    
    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0];
    slots = slots.filter(slot => slot.createdAt!.split('T')[0] === todayDateString);
    if (slotId) {
      const slotsBySlotId = slots.filter(
        (slot) => slot.slotId === slotId
      );
      console.log(slotsBySlotId);
      return NextResponse.json(slotsBySlotId);
    }
    if (email) {
      const slotsByDate = slots.filter(
        (slot) => slot.heldBy === email
      );
      return NextResponse.json(slotsByDate);
    }

    return NextResponse.json(slots);
  } catch (error) {
    console.error('Failed to process slots request:', error);
    return NextResponse.json(
      { error: 'Failed to process slots request' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const filePath = path.join(dataPath, 'slots.json');
    const newSlots = await request.json();
    await fs.writeFile(filePath, JSON.stringify(newSlots, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update slots data:', error);
    return NextResponse.json(
      { error: 'Failed to update slots data' },
      { status: 500 }
    );
  }
}
export async function PUT(request: Request) {
  try {
    const filePath = path.join(dataPath, 'slots.json');
    const updatedSlots = await request.json();
    
    // Validate that we received an array
    if (!Array.isArray(updatedSlots)) {
      return NextResponse.json(
        { error: 'Expected an array of slots' },
        { status: 400 }
      );
    }

    // Read current slots
    const currentData = await fs.readFile(filePath, 'utf-8');
    let currentSlots: Slot[] = JSON.parse(currentData);
    
    // Create a map of existing slots for quick lookup
    const existingSlotsMap = new Map(currentSlots.map(slot => [slot.slotId, slot]));
    
    // Process updates
    const updatedIds = new Set();
    const newSlots: Slot[] = [];
    
    for (const updatedSlot of updatedSlots) {
      // Basic validation
      if (!updatedSlot.id || !updatedSlot.startTime || !updatedSlot.endTime) {
        console.warn('Skipping invalid slot:', updatedSlot);
        continue;
      }

      if (existingSlotsMap.has(updatedSlot.id)) {
        // Update existing slot
        existingSlotsMap.set(updatedSlot.id, updatedSlot);
        updatedIds.add(updatedSlot.id);
      } else {
        // Add new slot
        newSlots.push(updatedSlot);
      }
    }
    
    // Combine updated and new slots
    const resultSlots = [
      ...Array.from(existingSlotsMap.values()),
      ...newSlots
    ];
    
    // Write back to file
    await fs.writeFile(filePath, JSON.stringify(resultSlots, null, 2));
    
    return NextResponse.json({ 
      success: true,
      updatedCount: updatedIds.size,
      addedCount: newSlots.length,
      totalSlots: resultSlots.length
    });
  } catch (error) {
    console.error('Failed to update slots:', error);
    return NextResponse.json(
      { error: 'Failed to update slots' },
      { status: 500 }
    );
  }
}