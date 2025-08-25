import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';
import { getStepFromStatus } from '@/types';
import { retrieveInfo, truncateTokens } from '@/lib/rag';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatRequest {
  message: string;
  userId?: string;
  userRole?: 'influencer' | 'admin';
  userName?: string;
  conversationHistory?: ChatMessage[];
  source?: 'typed' | 'chip';
}

// Platform context for AI responses
const PLATFORM_CONTEXT = `
あなたはMusubime（ムスビメ）のAIアシスタントです。Musubimeは、インフルエンサーマーケティングキャンペーンの管理・運用・承認・進行管理を行うワークフロー管理プラットフォームです。AI英会話アプリ「スピーク」のインフルエンサーマーケティングように作成されました。

## プラットフォームの概要
Musubimeは、ブランドマネージャーとコンテンツクリエイター間の橋渡しをし、キャンペーン全体のライフサイクルを通じて透明性、説明責任、シームレスなワークフロー管理を提供します。

## 主な機能
1. **キャンペーン管理**: インフルエンサーマーケティングキャンペーンの全工程を管理
2. **ワークフロー自動化**: 手動のスプレッドシート管理とメール調整を自動化
3. **リアルタイム協業**: 管理者とインフルエンサー間の即座のコミュニケーション
4. **承認ワークフロー**: コンテンツがブランド基準を満たすための組み込み承認フロー
5. **進捗の可視化**: キャンペーンの進捗と次のステップの明確な可視性

## キャンペーンのステータス：英語のkeyについては言及せず、日本語で回答してください
- **not_started**: 未開始
- **meeting_scheduling**: 打ち合わせ予約中
- **meeting_scheduled**: 打ち合わせ予約済み
- **plan_creating**: 構成案作成中
- **plan_submitted**: 構成案提出済み
- **plan_revising**: 構成案修正中
- **draft_creating**: 初稿作成中
- **draft_submitted**: 初稿提出済み
- **draft_revising**: 初稿修正中
- **scheduling**: 投稿準備中
- **scheduled**: 投稿済み
- **payment_processing**: 送金手続き中
- **completed**: PR完了
- **cancelled**: PRキャンセル

## サポートするプラットフォーム
- YouTube（長編・ショート）
- Instagram Reels
- TikTok
- X (Twitter)
- Podcast
- Blog

## キャンペーンワークフロー
1. **オンボーディング**: インタラクティブな調査によるキャンペーンセットアップ
2. **打ち合わせ調整**: 自動スケジューリングと完了追跡
3. **コンテンツ企画**: 構成案の構造化された提出と承認プロセス
4. **コンテンツ制作**: ドラフト提出、レビュー、修正ワークフロー
5. **公開**: スケジューリング調整とライブ管理
6. **支払い処理**: 自動請求書生成と支払い追跡

## データ統合
- Google Sheetsとのリアルタイム同期
- 70以上の列を持つ包括的なキャンペーンデータ
- 自動バックアップとリカバリーシステム

## ユーザーの役割
- **インフルエンサー**: パーソナライズされたダッシュボードで関連するキャンペーンとアクションのみ表示
- **管理者**: すべてのキャンペーンにわたる管理機能を持つ包括的な概要

## 応答のガイドライン
- 日本語で親しみやすく、プロフェッショナルに回答してください
- ユーザーの役割（インフルエンサー・管理者）に応じて適切な情報を提供してください
- 具体的な機能や手順について詳細に説明してください
- わからない場合は、正直に「確認いたします」と答えてください
- 常にユーザーの成功を支援する姿勢で対応してください

現在のユーザー情報:
- ユーザーID: {userId}
- 役割: {userRole}

## コンテキストJSONの利用方法
- 提供される\`campaignsContext\`には、各キャンペーンのステータス・スケジュール・提出URL・提出状況・分析情報・支払い状況などが含まれます。
- これらの情報を元に、次のステップや不足している提出物、期日のリマインド、支払い手続きの案内などを具体的に提示してください。
- アカウントの秘密情報（パスワード等）は出力しないでください。必要な場合は「ダッシュボードの該当セクションを確認してください」と案内してください。
`;

// Common FAQ responses
const FAQ_RESPONSES = {
  campaign_status: {
    keywords: ['ステータス', 'status', '進捗', '状況', 'どこまで'],
    response: `キャンペーンのステータスは以下の段階があります：

1. **未開始** → **打ち合わせ予約中** → **打ち合わせ予約済み**
2. **構成案作成中** → **構成案提出済み** → **構成案修正中**（必要に応じて）
3. **初稿作成中** → **初稿提出済み** → **初稿修正中**（必要に応じて）
4. **投稿準備中** → **投稿済み**
5. **送金手続き中** → **PR完了**

現在のステータスは、ダッシュボードの「次のステップ」セクションで確認できます。何か具体的にお困りのことがあれば、詳しくお聞かせください。`
  },
  
  submission_process: {
    keywords: ['提出', '提出方法', 'URL', 'リンク', '送信'],
    response: `コンテンツの提出方法：

**構成案の提出**：
1. 構成案を作成し、共有可能なURLを準備
2. ダッシュボードの「次のステップ」でURL入力欄に貼り付け
3. 「提出」ボタンをクリック

**初稿の提出**：
1. 動画や記事を作成し、共有可能なURLを準備
2. 同様にダッシュボードから提出

**投稿の報告**：
1. コンテンツを公開後、公開URLを提出
2. 概要欄と固定コメントの設定確認チェックボックスをオン

提出後は自動的にステータスが更新され、確認をお待ちいただく状態になります。`
  },
  
  payment_process: {
    keywords: ['支払い', '送金', '報酬', '請求書', 'お金', '入金'],
    response: `支払いプロセスについて：

**必要な手続き**：
1. **請求書の作成**: テンプレートを使用して請求書を作成
2. **フォームの記入**: 支払い情報フォームに必要事項を入力
3. **送金手続き開始**: 両方完了後、「送金手続き開始」ボタンをクリック

**送金のタイミング**：
- コンテンツ投稿完了後
- 必要書類の提出確認後
- 通常3-5営業日で着金

**着金確認**：
- 着金確認後、ダッシュボードの「着金を確認しました」ボタンをクリック
- これでキャンペーンが完了となります

ご不明な点があれば、partnerships_jp@usespeak.comまでお問い合わせください。`
  },
  
  technical_support: {
    keywords: ['エラー', '問題', 'バグ', '動かない', '表示されない', 'ログイン'],
    response: `技術的な問題が発生していますね。以下をお試しください：

**基本的なトラブルシューティング**：
1. ページの再読み込み（F5キーまたはCtrl+R）
2. ブラウザキャッシュのクリア
3. 別のブラウザで試す
4. ダッシュボード右上の更新ボタンをクリック

**ログインの問題**：
- ユーザーIDとパスワードを再確認
- 半角英数字で入力されているかチェック

**データが表示されない場合**：
- Google Sheetsとの同期に少し時間がかかる場合があります
- 数分待ってから再度確認してください

問題が解決しない場合は、具体的なエラーメッセージやスクリーンショットと共にサポートまでご連絡ください。`
  }
};

function findBestResponse(message: string, userRole?: string): string | null {
  const lowerMessage = message.toLowerCase();
  
  for (const [category, faq] of Object.entries(FAQ_RESPONSES)) {
    if (faq.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return faq.response;
    }
  }
  
  return null;
}

function generateContextualResponse(message: string, userId?: string, userRole?: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Greeting responses
  if (lowerMessage.includes('こんにちは') || lowerMessage.includes('はじめまして') || lowerMessage.includes('hello')) {
    return `こんにちは！Musubimeサポートチームです。${userRole === 'admin' ? '管理者' : 'インフルエンサー'}としてログインされていますね。何かお手伝いできることがあれば、お気軽にお聞かせください。`;
  }
  
  // Check for FAQ responses
  const faqResponse = findBestResponse(message, userRole);
  if (faqResponse) {
    return faqResponse;
  }
  
  // Role-specific responses
  if (userRole === 'admin') {
    if (lowerMessage.includes('管理') || lowerMessage.includes('承認') || lowerMessage.includes('レビュー')) {
      return `管理者機能について：

**キャンペーン管理**：
- 全キャンペーンの一覧表示と検索
- ステータスの一括更新
- 提出されたコンテンツの承認・修正依頼

**承認ワークフロー**：
- 構成案と初稿の確認・承認
- フィードバック機能で修正指示
- 自動通知システム

**分析とレポート**：
- キャンペーンパフォーマンス追跡
- ROI分析と予算管理
- カスタムレポートの生成

具体的にどの機能についてお知りになりたいですか？`;
    }
  }
  
  if (userRole === 'influencer') {
    if (lowerMessage.includes('始め方') || lowerMessage.includes('最初') || lowerMessage.includes('どうすれば')) {
      return `インフルエンサーとしての始め方：

**1. 基本情報の入力**：
- ダッシュボードの「基本情報の入力」から開始
- プラットフォーム、連絡先、希望日程などを入力

**2. 打ち合わせの予約**：
- 提供されたリンクから都合の良い日時を選択
- 予約完了後、「予約完了」ボタンをクリック

**3. キャンペーン進行**：
- 各ステップで明確な指示が表示されます
- 期限を確認しながら進めてください

**サポート**：
- このチャットでいつでも質問可能
- 緊急時はpartnerships_jp@usespeak.comまで

何か具体的にお困りのことがあれば、詳しくお聞かせください！`;
    }
  }
  
  // Platform-specific questions
  if (lowerMessage.includes('youtube') || lowerMessage.includes('ユーチューブ')) {
    return `YouTubeキャンペーンについて：

**対応形式**：
- YouTube長編動画（通常の動画コンテンツ）
- YouTubeショート（60秒以下の縦型動画）

**ガイドライン**：
- 専用のガイドラインドキュメントをご確認ください
- 概要欄への指定テキスト追加が必要
- 固定コメントの設定も重要です

**提出時の注意点**：
- 動画は限定公開または公開状態で提出
- URLは正確にコピーしてください
- サムネイルとタイトルも事前確認が推奨されます

YouTubeに関して他にご質問はありますか？`;
  }
  
  // Default response
  return `申し訳ございませんが、その件について詳細を確認いたします。

**よくある質問**：
- キャンペーンのステータスと進捗について
- コンテンツの提出方法
- 支払いプロセス
- 技術的なサポート

**直接サポート**：
より具体的なサポートが必要でしたら、partnerships_jp@usespeak.comまでお問い合わせください。スクリーンショットや詳細な状況説明があると、より迅速にサポートできます。

他にご質問がございましたら、お気軽にお聞かせください！`;
}

export async function POST(request: NextRequest) {
  try {
    const { message, userId, userRole, userName, conversationHistory, source }: ChatRequest = await request.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get user context if available
    let userContext = '';
    let campaignsContext: any[] = [];
    let totals = { activeTotal: 0, allTotal: 0 };
    let masterWho = 'Musubime AI Assistant';
    let masterPlatform: string | undefined = undefined;
    let masterStep: string | undefined = undefined;
    if (userId && userRole) {
      try {
        // Get user's campaigns for context
        const campaigns = await dataService.getUserCampaigns(userId);
        const activeCampaigns = campaigns.filter(c => !['completed', 'cancelled'].includes(c.status));
        
        userContext = `
現在のユーザー情報:
- アクティブキャンペーン: ${activeCampaigns.length}件
- 総キャンペーン: ${campaigns.length}件
- 最新キャンペーンステータス: ${activeCampaigns[0]?.status || '該当なし'}
        `;
        
        // Helper to coerce various truthy strings to boolean
        const toBool = (v: any) => {
          const s = String(v ?? '').trim().toLowerCase();
          return s === 'true' || s === '1' || s === 'yes' || s === 'y' || s === '済' || s === 'submitted';
        };

        // Build structured, mapped campaign context (limited to 10)
        const extractLatestRevisionFeedback = (messageDashboard?: string): string => {
          if (!messageDashboard || typeof messageDashboard !== 'string') return '';
          try {
            const messages = JSON.parse(messageDashboard);
            if (!Array.isArray(messages) || messages.length === 0) return '';
            const revisionFeedback = messages
              .filter((m: any) => m?.type === 'revision_feedback')
              .sort((a: any, b: any) => new Date(b?.timestamp || 0).getTime() - new Date(a?.timestamp || 0).getTime())[0];
            return revisionFeedback?.content || '';
          } catch {
            return '';
          }
        };

        campaignsContext = activeCampaigns
          .slice(0, 10)
          .map(c => ({
            id: c.id,
            title: c.title,
            status: c.status,
            step: getStepFromStatus((c.status as any) ?? 'not_started'),
            platform: c.platform,
            contractedPrice: c.contractedPrice,
            schedules: c.schedules,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            urls: {
              plan: c.campaignData?.url_plan,
              draft: c.campaignData?.url_draft,
              content: c.campaignData?.url_content,
              mainForm: c.campaignData?.url_main_form,
              payoutForm: c.campaignData?.url_payout_form,
            },
            submissionStatus: {
              contractFormSubmitted: toBool(c.campaignData?.contract_form_submitted),
              planSubmitted: toBool(c.campaignData?.plan_submitted),
              draftSubmitted: toBool(c.campaignData?.draft_submitted),
              liveVideoSubmitted: toBool(c.campaignData?.live_video_submitted),
              payoutFormSubmitted: toBool(c.campaignData?.payout_form_submitted),
            },
            payout: {
              payoutDone: toBool(c.campaignData?.payout_done),
              payoutFormLink: c.campaignData?.payout_form_link,
            },
            analytics: {
              followers: c.campaignData?.followers,
              impressionsEstimated: c.campaignData?.imp_est,
              impressionsActual: c.campaignData?.imp_actual,
            },
            financial: {
              currency: c.currency,
              contractedPrice: c.contractedPrice,
              spendJpyTaxed: c.campaignData?.spend_jpy_taxed,
            },
            meta: {
              group: c.campaignData?.group,
              genre: c.campaignData?.genre,
              tier: c.campaignData?.tier,
              platformTier: c.campaignData?.platform_tier,
            },
            latestFeedback: extractLatestRevisionFeedback(c.campaignData?.message_dashboard),
          }));

        // Totals
        totals.activeTotal = activeCampaigns.reduce((sum, c) => sum + (typeof c.contractedPrice === 'number' ? c.contractedPrice : 0), 0);
        totals.allTotal = campaigns.reduce((sum, c) => sum + (typeof c.contractedPrice === 'number' ? c.contractedPrice : 0), 0);

        // Add quick highlight for the first campaign
        if (campaignsContext.length > 0) {
          const current = campaignsContext[0];
          userContext += `
- 現在のキャンペーン: ${current.title}
- ステータス/ステップ: ${current.status} / ${current.step}
- プラットフォーム: ${current.platform}
- 契約金額: ${typeof current.contractedPrice === 'number' ? `¥${current.contractedPrice.toLocaleString()}` : '未設定'}
          `;
          masterPlatform = String(current.platform || '').trim() || undefined;
          masterStep = String(current.step || '').trim() || undefined;
        }
      } catch (error) {
        console.error('Error fetching user context:', error);
        // Continue without user context
      }
    }

    // If OPENAI_API_KEY is present, use OpenAI for responses; otherwise fallback
    const apiKey = process.env.OPENAI_API_KEY;
    let finalResponse = '';

    if (apiKey) {
      try {
        // Retrieve docs context from info.txt based on the user message
        let docsContext = '';
        try {
          const docs = await retrieveInfo(message, 5);
          const compact = docs
            .map((d, i) => `---
[docs ${i + 1}] (${d.meta.source}:${d.meta.startLine}-${d.meta.endLine})
${truncateTokens(d.text, 400)}
`)
            .join('\n');
          docsContext = compact;
        } catch (e) {
          // Non-fatal: continue without docs
          console.warn('Docs retrieval failed:', e);
        }

        const systemPrompt = `${PLATFORM_CONTEXT.replace('{userId}', userId || '不明').replace('{userRole}', userRole || '不明')}
MASTER CONTEXT:
- あなたは: ${masterWho}
- 対象プラットフォーム: ${masterPlatform || '不明'}
- 現在のステップ: ${masterStep || '不明'}

ログイン中のユーザー名: ${userName || '不明'}
${userContext}

// ユーザーのキャンペーンコンテキスト（JSON、最大10件）:
${JSON.stringify(campaignsContext)}

// 報酬サマリー（JPY）:
${JSON.stringify(totals)}

// Docs context (抽出された該当箇所のみ):
${docsContext}

出力ポリシー:
- すべて日本語で回答してください
- 回答はMarkdownで整形してください（見出し、箇条書きなど）
- 金額は日本円で ¥1,234 の形式にフォーマットしてください
- 回答は上記のコンテキスト（キャンペーンJSONとサマリー）を最優先で使用してください
- コンテキストに無い情報は推測せず、「手元のデータでは不明です」と明示してください
- MASTER CONTEXTのプラットフォーム・ステップに厳密に合わせ、他プラットフォームの情報を混在させないでください（ユーザーが明示した場合を除く）
- パスワードなどの秘匿情報は表示しないでください`;

        // Build messages for chat completion
        const history = (conversationHistory || []).slice(-6).map(m => ({
          role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: m.content,
        }));

        const payload = {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: message }
          ],
          temperature: 0.3,
          max_tokens: 600,
        };

        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          throw new Error(`OpenAI API error ${resp.status}`);
        }

        const json = await resp.json();
        finalResponse = json.choices?.[0]?.message?.content?.trim() || '';
      } catch (aiError) {
        console.error('OpenAI error, falling back:', aiError);
      }
    }

    // Fallback handling
    if (!finalResponse) {
      // If the message is typed by the user, avoid canned fallback and signal unavailable
      if (source === 'typed') {
        return NextResponse.json(
          { error: 'LLM unavailable', response: '' },
          { status: 503 }
        );
      }
      // Otherwise allow contextual canned response (e.g., quick chips)
      const fallback = generateContextualResponse(message, userId, userRole);
      finalResponse = userContext && fallback.includes('申し訳ございませんが')
        ? fallback.replace('申し訳ございませんが、その件について詳細を確認いたします。', `${userContext}\n\n申し訳ございませんが、その件について詳細を確認いたします。`)
        : fallback;
    }

    return NextResponse.json({ 
      response: finalResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        response: 'すみません、現在サービスに接続できません。しばらくしてからもう一度お試しください。'
      },
      { status: 500 }
    );
  }
}
