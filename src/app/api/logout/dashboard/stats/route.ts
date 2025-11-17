import { NextResponse } from 'next/server';

export async function GET() {
  
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network

  return NextResponse.json({
    totalLoans: 156,
    activeLoans: 149,
    totalDisbursed: 52800000,
    totalCollected: 42100000,
    overdueLoans: 7,
    todayCollections: 3200000,
  });
}