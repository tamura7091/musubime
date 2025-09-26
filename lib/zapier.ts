export type ZapierEventType = 'revision_request' | 'reminder';

interface BasePayload {
  influencer?: { id?: string; name?: string; email?: string };
  platform_label?: string;
  item_type?: '構成案' | '初稿' | '動画アップロード' | 'トライアル' | '打ち合わせ';
  due_date?: string;
  due_time?: string;
  dashboard_url?: string;
  feedback_bullets?: string;
  sender_name?: string;
  subject_prefix?: string; // e.g. [AI英会話スピークPR]
  is_auto?: boolean; // mark that email is automated
}

export async function triggerZapier(event: ZapierEventType, payload: BasePayload): Promise<{ ok: boolean; status?: number }> {
  try {
    const url = event === 'revision_request'
      ? process.env.ZAPIER_WEBHOOK_REVISION
      : process.env.ZAPIER_WEBHOOK_REMINDER;

    if (!url) {
      console.log(`⚠️ Zapier webhook for "${event}" not configured. Skipping.`);
      return { ok: false };
    }

    const body = {
      event,
      ...payload,
      // Defaults required by spec
      sender_name: payload.sender_name || 'Speakeasy Labs, Inc. マーケティングチーム',
      subject_prefix: payload.subject_prefix || '[AI英会話スピークPR]',
      is_auto: true,
      // Always include the dashboard URL for actions
      dashboard_url: payload.dashboard_url || 'https://musubime.app',
      support_email: 'partnerships_jp@usespeak.com',
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    console.log(`📡 Zapier POST ${event}: ${res.status}`);
    return { ok: res.ok, status: res.status };
  } catch (err) {
    console.error('❌ Zapier trigger failed:', err);
    return { ok: false };
  }
}


