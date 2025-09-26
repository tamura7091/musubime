import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';
import { triggerZapier } from '@/lib/zapier';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.has('t') || searchParams.get('nocache') === '1';
    console.log('🎯 API: Fetching updates', forceRefresh ? '(forceRefresh)' : '');
    const updates = await dataService.getUpdates({ forceRefresh });
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

// Trigger scheduled reminders (to be invoked by cron or external scheduler)
export async function PUT(request: NextRequest) {
  try {
    console.log('⏰ API: Triggering reminder scan');
    const campaigns = await dataService.getCampaigns();

    const today = new Date();
    const isSameDay = (a?: Date | null, b?: Date | null) => {
      if (!a || !b) return false;
      return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    };
    const daysDiff = (a: Date, b: Date) => Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));

    for (const c of campaigns) {
      const planD = c.schedules.planSubmissionDate ? new Date(c.schedules.planSubmissionDate) : null;
      const draftD = c.schedules.draftSubmissionDate ? new Date(c.schedules.draftSubmissionDate) : null;
      const liveD = c.schedules.liveDate ? new Date(c.schedules.liveDate) : null;

      // 1-week before reminders
      if (planD && daysDiff(planD, today) === 7) {
        await triggerZapier('reminder', {
          influencer: { id: c.influencerId, name: c.influencerName },
          platform_label: c.platform,
          item_type: '構成案',
          due_date: planD.toISOString().slice(0, 10),
          dashboard_url: 'https://musubime.app',
        });
      }
      if (draftD && daysDiff(draftD, today) === 7) {
        await triggerZapier('reminder', {
          influencer: { id: c.influencerId, name: c.influencerName },
          platform_label: c.platform,
          item_type: '初稿',
          due_date: draftD.toISOString().slice(0, 10),
          dashboard_url: 'https://musubime.app',
        });
      }
      if (liveD && daysDiff(liveD, today) === 7) {
        await triggerZapier('reminder', {
          influencer: { id: c.influencerId, name: c.influencerName },
          platform_label: c.platform,
          item_type: '動画アップロード',
          due_date: liveD.toISOString().slice(0, 10),
          dashboard_url: 'https://musubime.app',
        });
      }

      // Same-day reminders
      if (planD && isSameDay(planD, today)) {
        await triggerZapier('reminder', {
          influencer: { id: c.influencerId, name: c.influencerName },
          platform_label: c.platform,
          item_type: '構成案',
          due_date: planD.toISOString().slice(0, 10),
          dashboard_url: 'https://musubime.app',
        });
      }
      if (draftD && isSameDay(draftD, today)) {
        await triggerZapier('reminder', {
          influencer: { id: c.influencerId, name: c.influencerName },
          platform_label: c.platform,
          item_type: '初稿',
          due_date: draftD.toISOString().slice(0, 10),
          dashboard_url: 'https://musubime.app',
        });
      }
      if (liveD && isSameDay(liveD, today)) {
        await triggerZapier('reminder', {
          influencer: { id: c.influencerId, name: c.influencerName },
          platform_label: c.platform,
          item_type: '動画アップロード',
          due_date: liveD.toISOString().slice(0, 10),
          dashboard_url: 'https://musubime.app',
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ API: Reminder scan failed:', error);
    return NextResponse.json({ error: 'Failed to trigger reminders' }, { status: 500 });
  }
}
