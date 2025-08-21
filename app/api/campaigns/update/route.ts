import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/google-sheets';
import { dataService } from '@/lib/data-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Campaign update API called');
    const { campaignId, influencerId, newStatus, submittedUrl, urlType } = await request.json();
    
    console.log('📊 Update request:', {
      campaignId,
      influencerId,
      newStatus,
      submittedUrl,
      urlType
    });

    if (!campaignId || !influencerId || !newStatus) {
      return NextResponse.json(
        { error: 'campaignId, influencerId, and newStatus are required' },
        { status: 400 }
      );
    }

    // Update the Google Sheets
    const updateResult = await googleSheetsService.updateCampaignStatus(
      campaignId,
      influencerId,
      newStatus,
      submittedUrl,
      urlType
    );

    if (updateResult.success) {
      console.log('✅ Campaign updated successfully in Google Sheets');
      
      // Generate update based on status change
      try {
        const campaigns = await dataService.getCampaigns();
        const campaign = campaigns.find(c => c.id === campaignId);
        
        if (campaign) {
          let updateMessage = '';
          let updateType: 'submission' | 'status_change' | 'approval' = 'status_change';
          
          // Generate appropriate update message based on status
          switch (newStatus) {
            case 'plan_submitted':
              updateMessage = `${campaign.influencerName}さんから構成案が提出されました`;
              updateType = 'submission';
              break;
            case 'draft_submitted':
              updateMessage = `${campaign.influencerName}さんから初稿が提出されました`;
              updateType = 'submission';
              break;
            case 'scheduled':
              updateMessage = `${campaign.influencerName}さんのコンテンツが投稿されました！`;
              updateType = 'status_change';
              break;
            case 'completed':
              updateMessage = `${campaign.influencerName}さんのプロモーションが完了しました`;
              updateType = 'status_change';
              break;
            
            default:
              updateMessage = `${campaign.influencerName}さんのステータスが「${newStatus}」に更新されました`;
              updateType = 'status_change';
          }
          
          // Create the update
          await dataService.createUpdate({
            campaignId,
            influencerId: campaign.influencerId,
            influencerName: campaign.influencerName,
            type: updateType,
            message: updateMessage
          });
          
          console.log('📝 Update created for status change:', newStatus);
        }
      } catch (updateError) {
        console.error('⚠️ Failed to create update, but campaign was updated:', updateError);
      }
      
      return NextResponse.json({
        success: true,
        message: 'Campaign updated successfully',
        updatedAt: new Date().toISOString()
      });
    } else {
      console.error('❌ Failed to update campaign in Google Sheets:', updateResult.error);
      
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
          error: 'Failed to update campaign in Google Sheets',
          details: updateResult.error
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Campaign update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
