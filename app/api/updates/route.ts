import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';

export async function GET(request: NextRequest) {
  try {
    const updates = await dataService.getUpdates();
    return NextResponse.json(updates);
  } catch (error) {
    console.error('Updates API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch updates' },
      { status: 500 }
    );
  }
}
