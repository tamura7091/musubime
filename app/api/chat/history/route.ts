import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    const { campaignId, messages } = await request.json();

    if (!campaignId || !messages) {
      return NextResponse.json(
        { error: 'campaignId and messages are required' },
        { status: 400 }
      );
    }

    console.log('💬 Updating chat history for campaign:', campaignId);

    // Update chat_dashboard column in Google Sheets
    const result = await (googleSheetsService as any).updateChatHistory(
      campaignId,
      JSON.stringify(messages)
    );

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to update chat history' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ Error updating chat history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update chat history' },
      { status: 500 }
    );
  }
}

