import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/google-sheets';
import { formatAbbreviatedCurrency } from '@/lib/design-system';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      campaignId,
      platform,
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
      platform,
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

    // Build update payload; avoid overwriting platform if not provided by the inline form
    const updateData: Record<string, string> = {
      contact_email: email || '',
      spend_jpy: normalizedPrice || '',
      date_live: uploadDate || '',
      date_plan: planSubmissionDate || '',
      date_draft: draftSubmissionDate || '',
      repurposable: safeRepurposable,
      contract_name_dashboard: contractName || '',
      status_dashboard: 'trial',
      date_status_updated: new Date().toISOString() // Full timestamp with date and time
    };

    if (platform) {
      updateData.platform = platform;
    }

    console.log('🔄 Updating campaign with data:', updateData);

    // Find and update the campaign row
    const result = await googleSheetsService.updateCampaignOnboarding(campaignId, updateData);

    if (result.success) {
      console.log('✅ Campaign onboarding completed successfully');
      
      // Fire Zapier webhook (best-effort; does not block success response)
      try {
        const webhookUrl = process.env.ZAPIER_CONTRACT_WEBHOOK_URL;
        if (webhookUrl) {
          const payload = {
            event: 'contract_info_submitted',
            campaignId,
            platform: platform || '',
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
