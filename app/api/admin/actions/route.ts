import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/google-sheets';
import { triggerZapier } from '@/lib/zapier';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Admin action API called');
    const body = await request.json();
    const { campaignId, influencerId, action, submissionType, feedbackMessage, reminderType } = body;
    
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

    // Special branch: send reminder emails without changing status
    if (action === 'send_reminder') {
      if (reminderType !== 'trial' && reminderType !== 'draft' && reminderType !== 'meeting') {
        return NextResponse.json(
          { error: 'Invalid reminderType. Must be "trial", "draft", or "meeting"' },
          { status: 400 }
        );
      }

      // Load campaign row to get influencer name/email/platform/dates/status
      const rows = await googleSheetsService.getSpecificColumns([
        'id_campaign',
        'id_influencer',
        'name',
        'contact_email',
        'platform',
        'date_draft',
        'status_dashboard'
      ], influencerId);

      const row = rows.find(r => r['id_campaign'] === campaignId);
      if (!row) {
        return NextResponse.json(
          { error: 'Campaign row not found in Google Sheets' },
          { status: 404 }
        );
      }

      const influencerName = row['name'] || '';
      const influencerEmail = row['contact_email'] || '';
      const platformRaw = row['platform'] || '';
      const statusRaw = row['status_dashboard'] || 'not_started';
      const mappedStatus = googleSheetsService.mapStatus(statusRaw);

      // Compose Zapier payload
      const itemType = reminderType === 'trial' ? 'トライアル' : reminderType === 'meeting' ? '打ち合わせ' : '初稿';
      const dueDate = reminderType === 'draft' || reminderType === 'meeting' ? (row['date_draft'] || undefined) : undefined;
      const zap = await triggerZapier('reminder', {
        influencer: { id: influencerId, name: influencerName, email: influencerEmail },
        platform_label: platformRaw,
        item_type: itemType as any,
        due_date: dueDate,
        dashboard_url: 'https://musubime.app',
        subject_prefix: '[AI英会話スピークPR]',
        is_auto: true
      });

      // Append a message to message_dashboard for audit trail (without changing status)
      await googleSheetsService.updateCampaignStatus(
        campaignId,
        influencerId,
        mappedStatus,
        undefined,
        undefined,
        {
          type: 'reminder_sent',
          content: reminderType === 'trial' ? 'トライアル催促メール送信' : reminderType === 'meeting' ? 'リマインドを送る送信' : '初稿提出リマインド送信',
          timestamp: new Date().toISOString()
        }
      );

      return NextResponse.json({
        success: zap.ok,
        message: 'リマインダーを送信しました'
      }, { status: zap.ok ? 200 : 500 });
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
      
      // Fire Zapier email on revision requests
      if (action === 'revise_plan' || action === 'revise_draft') {
        // We don't have influencer email here; Zap can route by id/name if needed
        await triggerZapier('revision_request', {
          influencer: { id: influencerId },
          platform_label: undefined,
          item_type: action === 'revise_plan' ? '構成案' : '初稿',
          feedback_bullets: feedbackMessage,
          dashboard_url: 'https://musubime.app',
        });
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
