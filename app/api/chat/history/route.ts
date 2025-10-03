import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    
    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaignId is required' },
        { status: 400 }
      );
    }
    
    console.log('🎯 API: Fetching chat history for campaign:', campaignId);
    
    const chatHistory = await googleSheetsService.getChatHistory(campaignId);
    
    if (chatHistory === null) {
      return NextResponse.json(
        { error: 'Campaign not found or no chat history' },
        { status: 404 }
      );
    }
    
    // Parse the JSON if it exists
    let messages = [];
    if (chatHistory && chatHistory.trim()) {
      try {
        messages = JSON.parse(chatHistory);
        if (!Array.isArray(messages)) {
          messages = [];
        }
      } catch (parseError) {
        console.error('❌ Failed to parse chat history JSON:', parseError);
        messages = [];
      }
    }
    
    console.log('✅ API: Fetched chat history:', messages.length, 'messages');
    
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('❌ API: Failed to fetch chat history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}
