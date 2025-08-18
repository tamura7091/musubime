import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';

export async function GET(request: NextRequest) {
  try {
    console.log('🎯 API: Fetching updates');
    const updates = await dataService.getUpdates();
    console.log('✅ API: Fetched updates:', updates.length);
    
    return NextResponse.json(updates);
  } catch (error) {
    console.error('❌ API: Failed to fetch updates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch updates' },
      { status: 500 }
    );
  }
}

// Create a new update
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 API: Creating new update');
    const { campaignId, influencerId, influencerName, type, message } = await request.json();
    
    if (!campaignId || !influencerId || !influencerName || !type || !message) {
      return NextResponse.json(
        { error: 'campaignId, influencerId, influencerName, type, and message are required' },
        { status: 400 }
      );
    }

    const update = await dataService.createUpdate({
      campaignId,
      influencerId,
      influencerName,
      type,
      message
    });

    console.log('✅ API: Created update:', update.id);
    return NextResponse.json(update);
  } catch (error) {
    console.error('❌ API: Failed to create update:', error);
    return NextResponse.json(
      { error: 'Failed to create update' },
      { status: 500 }
    );
  }
}
