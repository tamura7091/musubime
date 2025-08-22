import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Admin action API called');
    const { campaignId, influencerId, action, submissionType, feedbackMessage } = await request.json();
    
    console.log('📊 Admin action request:', {
      campaignId,
      influencerId,
      action,
      submissionType,
      feedbackMessage
    });

    if (!campaignId || !influencerId || !action) {
      return NextResponse.json(
        { error: 'campaignId, influencerId, and action are required' },
        { status: 400 }
      );
    }

    // Map admin actions to new status
    let newStatus: string;
    switch (action) {
      case 'approve_plan':
        newStatus = 'draft_creating';
        break;
      case 'revise_plan':
        newStatus = 'plan_revising';
        break;
      case 'approve_draft':
        newStatus = 'scheduling';
        break;
      case 'revise_draft':
        newStatus = 'draft_revising';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action type' },
          { status: 400 }
        );
    }

    console.log(`📊 Admin action "${action}" -> new status: "${newStatus}"`);

    // Prepare message data for revision actions
    let messageData: { type: string; content: string; timestamp: string } | undefined;
    if (action.includes('revise') && feedbackMessage) {
      messageData = {
        type: 'revision_feedback',
        content: feedbackMessage,
        timestamp: new Date().toISOString()
      };
    }

    // Update the Google Sheets
    const updateResult = await googleSheetsService.updateCampaignStatus(
      campaignId,
      influencerId,
      newStatus,
      undefined, // submittedUrl
      undefined, // urlType  
      messageData
    );

    if (updateResult.success) {
      console.log('✅ Admin action completed successfully');
      
      // Generate appropriate response message
      let actionMessage = '';
      switch (action) {
        case 'approve_plan':
          actionMessage = '構成案が承認されました。初稿作成に進みます。';
          break;
        case 'revise_plan':
          actionMessage = feedbackMessage 
            ? `構成案の修正を依頼しました。フィードバック: ${feedbackMessage}`
            : '構成案の修正を依頼しました。';
          break;
        case 'approve_draft':
          actionMessage = '初稿が承認されました。投稿準備に進みます。';
          break;
        case 'revise_draft':
          actionMessage = feedbackMessage 
            ? `初稿の修正を依頼しました。フィードバック: ${feedbackMessage}`
            : '初稿の修正を依頼しました。';
          break;
      }
      
      return NextResponse.json({
        success: true,
        message: actionMessage,
        newStatus: newStatus,
        updatedAt: new Date().toISOString()
      });
    } else {
      console.error('❌ Failed to execute admin action:', updateResult.error);
      
      // Provide specific error message for authentication issues
      if (updateResult.error?.includes('Service Account')) {
        return NextResponse.json(
          { 
            error: 'Google Sheets write access not configured. Please contact the administrator to set up Service Account credentials.',
            details: updateResult.error
          },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to execute admin action',
          details: updateResult.error
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Admin action API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
