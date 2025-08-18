import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';

export async function GET(request: NextRequest) {
  try {
    const campaigns = await dataService.getCampaigns();
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Campaigns API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// For specific user campaigns
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    const userCampaigns = await dataService.getUserCampaigns(userId);
    
    return NextResponse.json(userCampaigns);
  } catch (error) {
    console.error('User campaigns API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user campaigns' },
      { status: 500 }
    );
  }
}
