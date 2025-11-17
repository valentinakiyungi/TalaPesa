import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Important: disables caching

export async function GET() {
  // Simulate real-time data (replace with Firebase later)
  await new Promise(resolve => setTimeout(resolve, 600));

  return NextResponse.json({
    totalLoans: 156,
    activeLoans: 149,
    totalDisbursed: 52800000,
    totalCollected: 42100000,
    overdueLoans: 7,
    todayCollections: 3200000,
  });
}
