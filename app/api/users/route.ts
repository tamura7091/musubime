import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';

export async function GET(request: NextRequest) {
  try {
    const users = await dataService.getUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
