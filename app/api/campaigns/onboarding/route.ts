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
      status_dashboard: 'meeting_scheduling',
      date_status_updated: new Date().toISOString().split('T')[0]
    };

    if (platform) {
      updateData.platform = platform;
    }

    console.log('🔄 Updating campaign with data:', updateData);

    // Find and update the campaign row
    const result = await googleSheetsService.updateCampaignOnboarding(campaignId, updateData);

    if (result.success) {
      console.log('✅ Campaign onboarding completed successfully');
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
