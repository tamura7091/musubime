import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/google-sheets';

export interface TemplateRule {
  id: number;
  name: string;
  conditions: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
  subject: string;
  body: string;
}

// In-memory storage for now (in production, this would be in a database)
let templateRules: TemplateRule[] = [
  {
    id: 1,
    name: 'Twitter初回アウトリーチ',
    conditions: [
      { field: 'platform', operator: '=', value: 'tw' },
      { field: 'outreachType', operator: '=', value: '1st time outreach' }
    ],
    subject: '【英会話アプリのPR依頼】',
    body: `【英会話アプリのPR依頼】
{greeting}、AI英会話アプリ「スピーク」の{teamMemberName}と申します。この度4月1日から行われるキャンペーン期間中にてPR投稿にご協力いただける形を募集しております。

首都圏・関西にて高畑充希さんを起用したテレビCMの再放送も予定しており、その一環としてぜひ、{influencerName}様にご協力いただきたいと考えております。

・投稿内容：今までに高いインプレッションを獲得した投稿フォーマットにてスピークを自然に入れ込む形でPR。リプ欄にリンクとPR内容を挿入。（例：https://x.com/mitsu7travel/status/1877882747529687422）
・投稿日希望：8月1日~8月3日

スケジュールがタイトとはなっていますが、以下の資料等をご覧の上ご判断いただきご興味がございましたらご希望の報酬をお聞かせいただけますでしょうか？

こちらの資料には今までのPRの経歴や詳細情報を記載しておりますので、ぜひお目通しいただければ幸いです：
・https://usespeak.notion.site/YouTube-1f3792ec2f108090b3fbe9b4051a4a4c?pvs=4

ご返信をお待ちしております。
※返信はCCも含め全員にお願いいたします。`
  },
  {
    id: 2,
    name: 'ショート動画初回アウトリーチ',
    conditions: [
      { field: 'platform', operator: '=', value: 'sv' },
      { field: 'outreachType', operator: '=', value: '1st time outreach' }
    ],
    subject: 'スピークのPR依頼｜{influencerName}様',
    body: `{influencerName}様

{greeting}。Speakeasy Labs, Inc.のマーケティングチームです。
{influencerName}様のコンテンツを拝見し、ぜひ弊社が開発するAI英会話アプリ「スピーク」のPRを縦動画（YouTubeショート、Reels、TikTok等）にて依頼させていただきたいと思いご連絡差し上げました。

【スピークとは】
米国シリコンバレー発のスピーキングに特化した英会話アプリです。

✅ OpenAI（ChatGPT開発元）から資金調達に成功
✅ 2023年に日本上陸後、App Store/Google Play教育カテゴリで1位を複数回獲得
✅ 2025年1月に高畑充希さんを起用したテレビCMを公開

【PRについて】
フォーマット：縦動画（YouTubeショート、Reels、TikTok等）フル動画
PR内容：スピークを{influencerName}様の普段のコンテンツスタイルに合わせて自然に紹介
投稿希望時期：2026年1月初旬
契約内容：広告としての二次利用込み
報酬：ご希望の金額を伺ったうえで相談させていただければと思います

PRに進む前に、事前にスピークのプレミアムプランをお渡しします。
実際にご利用いただき、自信を持ってお勧めできると感じていただけた場合にPRを依頼させていただきたいと思っております。

【次のステップ】
ご興味をいただけましたら、ご希望の報酬額を税込でお聞かせいただけますでしょうか？

【参考資料】
これまでのPR実績や詳細情報を以下の資料にまとめております。ぜひご一読いただけますと幸いです：
・インフルエンサー向け資料：https://usespeak.notion.site/5d43676ad8da4a418c722a7b47229f3d?pvs=4
・ホームページ：https://www.speak.com/jp
・テレビCM：https://www.youtube.com/watch?v=vH6f_Nctri0

{influencerName}様のご返信をお待ちしております。
※返信はCCも含め全員にお願いいたします。

ー
Speakeasy Labs, Inc.
{teamMemberName}`
  },
  {
    id: 3,
    name: 'ポッドキャスト初回アウトリーチ',
    conditions: [
      { field: 'platform', operator: '=', value: 'pc' },
      { field: 'outreachType', operator: '=', value: '1st time outreach' }
    ],
    subject: 'スピークのPR依頼｜{influencerName}様',
    body: `{influencerName}様
{greeting}。
AI英会話アプリ「スピーク」を運営するSpeakeasy Labs, Inc.のマーケティングチームです。
{influencerName}様のPodcastを拝聴し、リスナーとの自然で信頼感のあるコミュニケーションに大変共感し、ぜひスピークのPRについてご相談させていただきたくご連絡いたしました。

【スピークとは】
シリコンバレー発の、スピーキングに特化したAI英会話アプリです。
ネイティブと会話しているような自然な英語練習が、アプリひとつでいつでもどこでもできます。

✅ OpenAI（ChatGPTの開発元）から出資を受けた最先端AI技術
✅ 日本上陸からApp Store・Google Play教育カテゴリで1位を複数回獲得
✅ 2025年1月には高畑充希さん出演のテレビCMを公開

【Podcast PRのご相談】
・フォーマット：Podcast内でのご紹介（ホストリード/ご相談の上決定）
・配信希望時期：**ご都合に合わせ調整可能**
・報酬：ご希望の金額をお聞きした上でご相談させていただけますと幸いです

事前にスピークのプレミアムプランをご提供いたしますので、実際にご利用いただき、ご自身の言葉で安心してリスナーの皆様にご紹介いただけるかご判断いただければと思っております。

【参考資料】
サービスやこれまでのPR事例について、以下よりご確認いただけます：
・インフルエンサー向け資料：https://www.notion.so/usespeak/Podcast-224792ec2f1080f2a7d5fce804ce4b93?source=copy_link
・ホームページ：https://www.speak.com/jp
・テレビCM：https://www.youtube.com/watch?v=vH6f_Nctri0

Podcastという信頼性の高いメディアを通じ、リスナーの皆様にスピークを届けられることを楽しみにしております。

ご興味をお持ちいただけましたら、ぜひご希望の報酬額（税込）をお聞かせください。

{influencerName}様のご返信を心よりお待ちしております。
※ご返信はCCも含め全員にお願いいたします。

ー
Speakeasy Labs, Inc.
{teamMemberName}`
  },
  {
    id: 4,
    name: 'YouTube初回リーチ',
    conditions: [
      { field: 'platform', operator: '=', value: 'yt' },
      { field: 'outreachType', operator: '=', value: '1st time outreach' }
    ],
    subject: 'スピークのPR依頼｜{influencerName}様',
    body: `{influencerName}様
{greeting}。Speakeasy Labs, Inc. マーケティングチームです。
{influencerName}様のチャンネルにて公開されている動画を拝見し、ぜひ弊社の英会話アプリ「スピーク」のPRをご依頼させていただきたくご連絡いたしました。

【スピークとは】
米国シリコンバレー発、AIによる"スピーキング特化型"の英会話アプリです。
✅OpenAI（ChatGPTの開発元）より資金調達に成功
✅ 2023年日本上陸。App Store/Google Play 教育カテゴリにて1位を複数回獲得
✅ 高畑充希さんを起用したテレビCMを全国放映

【ご依頼内容】
    •    形式：YouTube 横動画でのPR（動画内でのご紹介を想定）
    •    投稿希望時期：2026年1月初旬
    •    報酬：ご希望の金額（税込）を伺ったうえで、相談させていただけますと幸いです

※ご依頼前に、スピークのプレミアムプランを無償提供いたします。
実際にお試しいただき、サービスにご納得いただけた場合に正式にPRをご依頼いたします。
過去のコラボ実績などのPR詳細はこちらをご覧ください→ https://usespeak.notion.site/5d43676ad8da4a418c722a7b47229f3d?pvs=4

ご興味をお持ちいただけましたら、
・ご希望の報酬金額（税込）
をご返信いただけますと幸いです。

{influencerName}様の返信を心よりお待ちしております。

【参考資料】
    •    アプリ公式サイト：https://www.speak.com/jp
    •    テレビCM：https://www.youtube.com/watch?v=vH6f_Nctri0

Speakeasy Labs, Inc.
{teamMemberName}`
  },
  {
    id: 5,
    name: 'YouTubeリーチアウト',
    conditions: [
      { field: 'platform', operator: '=', value: 'yt' },
      { field: 'outreachType', operator: '=', value: 'リーチアウト' }
    ],
    subject: 'スピークのPR依頼｜{influencerName}様',
    body: `{influencerName}様
{greeting}。Speakeasy Labs, Inc. マーケティングチームです。
{influencerName}様のチャンネルにて公開されている動画を拝見し、ぜひ弊社の英会話アプリ「スピーク」のPRをご依頼させていただきたくご連絡いたしました。

【スピークとは】
米国シリコンバレー発、AIによる"スピーキング特化型"の英会話アプリです。
✅OpenAI（ChatGPTの開発元）より資金調達に成功
✅ 2023年日本上陸。App Store/Google Play 教育カテゴリにて1位を複数回獲得
✅ 高畑充希さんを起用したテレビCMを全国放映

【ご依頼内容】
    •    形式：YouTube 横動画でのPR（動画内でのご紹介を想定）
    •    投稿希望時期：2026年1月初旬
    •    報酬：ご希望の金額（税込）を伺ったうえで、相談させていただけますと幸いです

※ご依頼前に、スピークのプレミアムプランを無償提供いたします。
実際にお試しいただき、サービスにご納得いただけた場合に正式にPRをご依頼いたします。
過去のコラボ実績などのPR詳細はこちらをご覧ください→ https://usespeak.notion.site/5d43676ad8da4a418c722a7b47229f3d?pvs=4

ご興味をお持ちいただけましたら、
・ご希望の報酬金額（税込）
をご返信いただけますと幸いです。

{influencerName}様の返信を心よりお待ちしております。

【参考資料】
    •    アプリ公式サイト：https://www.speak.com/jp
    •    テレビCM：https://www.youtube.com/watch?v=vH6f_Nctri0

Speakeasy Labs, Inc.
{teamMemberName}`
  }
];

export async function GET() {
  try {
    // Try loading from Google Sheets for production persistence
    try {
      const templates = await (googleSheetsService as any).getTemplates();
      if (templates && Array.isArray(templates) && templates.length > 0) {
        // Also update in-memory cache for this runtime
        templateRules = templates;
        return NextResponse.json({ success: true, templates });
      }
    } catch (e: any) {
      if (e?.code !== 'GOOGLE_SHEETS_NOT_CONFIGURED') {
        console.log('⚠️ Falling back to in-memory templates. Reason:', e?.message || e);
      }
    }

    // Fallback to in-memory defaults
    return NextResponse.json({ success: true, templates: templateRules });
  } catch (error: any) {
    console.error('❌ Error fetching templates:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed to fetch templates'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, templates } = body;

    if (action === 'save') {
      // Update in-memory cache immediately
      templateRules = templates;

      // Attempt to persist to Google Sheets
      try {
        const result = await (googleSheetsService as any).saveTemplates(templates);
        if (!result.success) {
          console.log('⚠️ Failed to persist templates to Google Sheets:', result.error);
        }
      } catch (e: any) {
        if (e?.code !== 'GOOGLE_SHEETS_NOT_CONFIGURED') {
          console.log('⚠️ Error saving templates to Google Sheets:', e?.message || e);
        } else {
          console.log('ℹ️ Google Sheets not configured; templates saved in-memory only');
        }
      }

      console.log('✅ Templates saved (in-memory, attempted persistence):', templates.length);

      return NextResponse.json({
        success: true,
        message: 'Templates saved successfully'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error: any) {
    console.error('❌ Error saving templates:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed to save templates'
    }, { status: 500 });
  }
}

// Helper function to match template rules against influencer data
function findMatchingTemplate(
  influencerData: {
    platform: string;
    outreachType: string;
    previousContact: boolean;
  },
  templates: TemplateRule[]
): TemplateRule | null {
  
  for (const template of templates) {
    let matches = true;
    
    for (const condition of template.conditions) {
      const { field, operator, value } = condition;
      let fieldValue: any;
      
      switch (field) {
        case 'platform':
          fieldValue = influencerData.platform;
          break;
        case 'outreachType':
          fieldValue = influencerData.outreachType;
          break;
        case 'previousContact':
          fieldValue = influencerData.previousContact ? 'true' : 'false';
          break;
        default:
          fieldValue = '';
      }
      
      switch (operator) {
        case '=':
          if (fieldValue !== value) matches = false;
          break;
        case '!=':
          if (fieldValue === value) matches = false;
          break;
        case 'contains':
          if (!fieldValue.toString().includes(value)) matches = false;
          break;
        default:
          matches = false;
      }
      
      if (!matches) break;
    }
    
    if (matches) {
      return template;
    }
  }
  
  return null;
}
