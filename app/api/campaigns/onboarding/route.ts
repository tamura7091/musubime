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

    // Update the campaign in Google Sheets
    const updateData = {
      platform: platform,
      contact_email: email,
      spend_jpy: price ? formatAbbreviatedCurrency(parseInt(price)) : '',
      date_live: uploadDate,
      date_plan: planSubmissionDate,
      date_draft: draftSubmissionDate,
      repurposable: repurposable === 'yes' ? 'TRUE' : 'FALSE',
      status_dashboard: 'meeting_scheduling', // Move to next status
      date_status_updated: new Date().toISOString().split('T')[0] // Today's date
    };

    console.log('🔄 Updating campaign with data:', updateData);

    // Find and update the campaign row
    const success = await googleSheetsService.updateCampaignOnboarding(campaignId, updateData);

    if (success) {
      console.log('✅ Campaign onboarding completed successfully');
      return NextResponse.json({ 
        success: true, 
        message: '基本情報が正常に更新されました' 
      });
    } else {
      console.error('❌ Failed to update campaign onboarding');
      return NextResponse.json(
        { success: false, message: '更新に失敗しました' },
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
