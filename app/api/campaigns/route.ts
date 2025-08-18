import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    console.log('🎯 API: Fetching campaigns for user:', userId);
    const campaigns = await dataService.getUserCampaigns(userId);
    console.log('✅ API: Fetched campaigns:', campaigns.length);
    console.log('📊 API: Campaign statuses:', campaigns.map(c => ({ id: c.id, status: c.status, influencerId: c.influencerId })));
    
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('❌ API: Failed to fetch campaigns:', error);
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
