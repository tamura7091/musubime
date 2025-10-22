import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/google-sheets';
import { formatAbbreviatedCurrency } from '@/lib/design-system';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      campaignId,
      contractName,
      email,
      price,
      uploadDate,
      planSubmissionDate,
      draftSubmissionDate,
      repurposable
    } = body;

    console.log('📝 Onboarding survey submission:', {
      campaignId,
      contractName,
      email,
      price,
      uploadDate,
      planSubmissionDate,
      draftSubmissionDate,
      repurposable
    });

    // Sanitize and normalize inputs
    const normalizedPrice = typeof price === 'string' ? price.replace(/\D/g, '') : '';
    const safeRepurposable = repurposable === 'yes' ? 'TRUE' : 'FALSE';

    // Check if this is a long-term contract user
    const campaigns = await googleSheetsService.getCampaigns(undefined, { forceRefresh: true });
    const currentCampaign = campaigns.find(c => c.id === campaignId);
    const isLongTermContract = currentCampaign?.isLongTermContract;

    console.log('🔍 Campaign info:', { 
      campaignId, 
      isLongTermContract,
      totalCampaigns: campaigns.length 
    });

    // Build update payload; avoid overwriting platform if not provided by the inline form
    // Note: contact_email should already be in the sheet and is NOT updated from the survey
    // Note: platform should already be set in the sheet and should NOT be updated from the survey
    const updateData: Record<string, string> = {
      spend_jpy: normalizedPrice || '',
      date_live: uploadDate || '',
      date_plan: planSubmissionDate || '',
      date_draft: draftSubmissionDate || '',
      repurposable: safeRepurposable,
      contract_name_dashboard: contractName || '',
      status_dashboard: 'trial',
      date_status_updated: new Date().toISOString() // Full timestamp with date and time
    };

    // Platform should not be updated from survey - it's already set in the sheet

    console.log('🔄 Updating campaign with data:', updateData);

    // Find and update the campaign row
    const result = await googleSheetsService.updateCampaignOnboarding(campaignId, updateData);

    // For long-term contracts, update quarterly dates for all not_started campaigns
    if (isLongTermContract && result.success) {
      try {
        console.log('📅 Long-term contract detected, updating quarterly dates for all not_started campaigns');
        
        // Get the influencer ID from the current campaign
        const influencerId = currentCampaign.influencerId;
        
        // Find all campaigns for this influencer
        const influencerCampaigns = campaigns.filter(c => c.influencerId === influencerId);
        
        // Find not_started campaigns (excluding the one we just updated to 'trial')
        const notStartedCampaigns = influencerCampaigns
          .filter(c => c.status === 'not_started' && c.id !== campaignId)
          .sort((a, b) => {
            // Extract campaign numbers and sort ascending (youngest first)
            const numA = parseInt((a.id.match(/_(\d+)$/) || ['', '0'])[1], 10);
            const numB = parseInt((b.id.match(/_(\d+)$/) || ['', '0'])[1], 10);
            return numA - numB;
          });
        
        console.log(`📋 Found ${notStartedCampaigns.length} not_started campaigns to update`);
        
        if (notStartedCampaigns.length > 0) {
          // Calculate quarterly dates starting from the uploaded date
          const baseDate = uploadDate ? new Date(uploadDate) : new Date();
          const quarterlyDates = await googleSheetsService.calculateQuarterlyDates(baseDate, notStartedCampaigns.length);
          
          console.log('📅 Calculated quarterly dates:', quarterlyDates);
          
          // Update each not_started campaign with its quarterly date
          for (let i = 0; i < notStartedCampaigns.length; i++) {
            const campaign = notStartedCampaigns[i];
            const quarterDate = quarterlyDates[i];
            
            await googleSheetsService.updateCampaignOnboarding(campaign.id, {
              date_live: quarterDate,
              date_status_updated: new Date().toISOString()
            });
            
            console.log(`✅ Updated campaign ${campaign.id} with date_live: ${quarterDate}`);
          }
        }
      } catch (quarterError) {
        console.error('⚠️ Failed to update quarterly dates:', quarterError);
        // Don't fail the main request if quarterly update fails
      }
    }

    if (result.success) {
      console.log('✅ Campaign onboarding completed successfully');
      
      // Fire Zapier webhook (best-effort; does not block success response)
      try {
        const webhookUrl = process.env.ZAPIER_CONTRACT_WEBHOOK_URL;
        if (webhookUrl) {
          const payload = {
            event: 'contract_info_submitted',
            campaignId,
            contractName: contractName || '',
            email: email || '',
            price: normalizedPrice || '',
            uploadDate: uploadDate || '',
            planSubmissionDate: planSubmissionDate || '',
            draftSubmissionDate: draftSubmissionDate || '',
            repurposable: safeRepurposable,
            timestamp: new Date().toISOString(),
          };
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (process.env.ZAPIER_WEBHOOK_SECRET) {
            headers['X-Webhook-Secret'] = process.env.ZAPIER_WEBHOOK_SECRET;
          }
          const zres = await fetch(webhookUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
          });
          console.log('📡 Zapier webhook sent:', { ok: zres.ok, status: zres.status });
        } else {
          console.log('ℹ️ ZAPIER_CONTRACT_WEBHOOK_URL not set; skipping Zapier call');
        }
      } catch (zerr) {
        console.error('⚠️ Failed to send Zapier webhook:', zerr);
      }
      return NextResponse.json({ 
        success: true, 
        message: '基本情報が正常に更新されました' 
      });
    } else {
      console.error('❌ Failed to update campaign onboarding');
      return NextResponse.json(
        { success: false, message: result.error || '更新に失敗しました' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error in onboarding API:', error);
    return NextResponse.json(
      { success: false, message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
