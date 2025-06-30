import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { Slot } from '@/app/types/booking';

const dataPath = path.join(process.cwd(), 'data');

export async function GET(
  request: Request,
  { params }: { params: { gameId: string } }
) {

  try {
    const { gameId } = await params;
    
    const filePath = path.join(dataPath, 'slots.json');
    const data = await fs.readFile(filePath, 'utf-8');
    let slots: Slot[] = JSON.parse(data);
    

    const today=new Date();
    const todayDateString=today.toISOString().split('T')[0];
    slots = slots.filter(slot =>{
    
    return slot.gameId === gameId && slot.createdAt?.split('T')[0]===todayDateString
  }); 
    return NextResponse.json(slots);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read slots data' },
      { status: 500 }
    );
  }
}











//edit
// // app/api/slots/route.ts
// import { promises as fs } from 'fs';
// import path from 'path';
// import { NextResponse } from 'next/server';
// import { Slot } from '@/app/types';

// const dataPath = path.join(process.cwd(), 'data');

// export async function GET(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const email = searchParams.get('email');
//     const date = searchParams.get('date');
    
//     const filePath = path.join(dataPath, 'slots.json');
//     const data = await fs.readFile(filePath, 'utf-8');
//     const slots: Slot[] = JSON.parse(data);

//     // If email and date are provided, filter slots
//     if (email && date) {
//       const filteredSlots = slots.filter(slot => {
//         return slot.date === date && 
//                (slot.heldBy === email || 
//                 slot.participants.some(p => p.email === email) ||
//                 (slot.status === 'failed' && slot.heldBy === email));
//       });
//       return NextResponse.json(filteredSlots);
//     }

//     // Otherwise return all slots
//     return NextResponse.json(slots);
//   } catch (error) {
//     return NextResponse.json(
//       { error: 'Failed to read slots data' },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(request: Request) {
//   try {
//     const filePath = path.join(dataPath, 'slots.json');
//     const data = await request.json();
//     await fs.writeFile(filePath, JSON.stringify(data, null, 2));
//     return NextResponse.json({ success: true });
//   } catch (error) {
//     return NextResponse.json(
//       { error: 'Failed to update slots data' },
//       { status: 500 }
//     );
//   }
// }

