'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { useDesignSystem } from '@/hooks/useDesignSystem';
import { useAuth } from '@/contexts/AuthContext';
import { Campaign, CampaignStatus, getStepFromStatus, getStepLabel } from '@/types';
import React from 'react';

// Utilities for platform label and date handling
const getPlatformLabel = (platform?: string): string => {
  const map: Record<string, string> = {
    youtube_long: 'YouTube（長編）',
    youtube_short: 'YouTube（ショート）',
    instagram_reel: 'Instagram Reels',
    tiktok: 'TikTok',
    x_twitter: 'X（Twitter）',
    podcast: 'Podcast',
    blog: 'Blog',
  };
  if (!platform) return '不明';
  return map[platform] || platform;
};

const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const formatMonthDay = (date: Date): string => {
  const mm = `${date.getMonth() + 1}`.padStart(2, '0');
  const dd = `${date.getDate()}`.padStart(2, '0');
  return `${mm}/${dd}`;
};

const daysBetweenToday = (date: Date): number => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(0, 0, 0, 0);
  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

const buildDeadlineText = (date: Date): string => {
  const d = daysBetweenToday(date);
  if (d === 0) return `${formatMonthDay(date)}が期限です（本日が期限）`;
  if (d > 0) return `${formatMonthDay(date)}が期限です（あと${d}日）`;
  return `${formatMonthDay(date)}が期限でした（${Math.abs(d)}日遅れ）`;
};

type NextStepInfo = { label: string; due?: Date | null };
const getNextStepInfo = (status: string, schedules: Campaign['schedules']): NextStepInfo => {
  const planDate = parseDate(schedules?.planSubmissionDate || undefined);
  const draftDate = parseDate(schedules?.draftSubmissionDate || undefined);
  const liveDate = parseDate(schedules?.liveDate || undefined);
  const meetingDate = parseDate(schedules?.meetingDate || undefined);

  switch (status) {
    case 'not_started':
      return { label: 'オンボーディングの基本情報入力と打ち合わせ日程の確定', due: meetingDate || planDate || draftDate || liveDate };
    case 'meeting_scheduling':
      return { label: '打ち合わせの予約確定', due: meetingDate };
    case 'meeting_scheduled':
      return { label: '構成案の作成・提出', due: planDate };
    case 'trial':
      return { label: '打ち合わせの予約確定', due: meetingDate };
    case 'plan_creating':
      return { label: '構成案の提出', due: planDate };
    case 'plan_submitted':
      return { label: 'フィードバック対応（必要に応じて）と初稿作成開始', due: draftDate };
    case 'plan_revising':
      return { label: '構成案の再提出', due: planDate };
    case 'draft_creating':
      return { label: '初稿の提出', due: draftDate };
    case 'draft_submitted':
      return { label: '公開に向けた最終調整', due: liveDate };
    case 'draft_revising':
      return { label: '初稿の再提出', due: draftDate };
    case 'scheduling':
      return { label: 'コンテンツの公開', due: liveDate };
    case 'scheduled':
      return { label: '送金手続き・実績共有', due: null };
    case 'payment_processing':
      return { label: '着金確認', due: null };
    case 'completed':
      return { label: '作業は完了しています', due: null };
    case 'cancelled':
      return { label: 'キャンセル済み', due: null };
    default:
      return { label: '次のアクションは確認中です', due: null };
  }
};

const extractLatestRevisionFeedback = (messageDashboard?: string): string => {
  if (!messageDashboard) return '';
  try {
    const messages = JSON.parse(messageDashboard);
    if (!Array.isArray(messages)) return '';
    const revision = messages
      .filter((m: any) => m && m.type === 'revision_feedback')
      .sort((a: any, b: any) => new Date(b?.timestamp || 0).getTime() - new Date(a?.timestamp || 0).getTime())[0];
    return revision?.content || '';
  } catch {
    return '';
  }
};

// Minimal markdown renderer: supports **bold**, *italic*, inline code `code`, links [text](url), and newlines
function renderMarkdown(text: string): React.ReactNode {
  // Helper to render inline markdown within a line
  const renderInline = (line: string): React.ReactNode[] => {
    const regex = /\[(.+?)\]\((https?:[^\s)]+)\)|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }
      if (match[1] && match[2]) {
        parts.push(
          <a key={`a-${match.index}`} href={match[2]} target="_blank" rel="noopener noreferrer" className="underline">
            {match[1]}
          </a>
        );
      } else if (match[3]) {
        parts.push(<strong key={`b-${match.index}`}>{match[3]}</strong>);
      } else if (match[4]) {
        parts.push(<em key={`i-${match.index}`}>{match[4]}</em>);
      } else if (match[5]) {
        parts.push(
          <code key={`c-${match.index}`} className="px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(125,125,125,0.2)' }}>
            {match[5]}
          </code>
        );
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }
    return parts;
  };

  const lines = text.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length === 0) return;
    elements.push(
      <ul key={`ul-${elements.length}`} className="list-disc pl-5 space-y-1">
        {listBuffer.map((item, idx) => (
          <li key={`li-${idx}`}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine ?? '';
    // Headings (### )
    const h3 = line.match(/^\s*###\s+(.*)$/);
    if (h3) {
      flushList();
      elements.push(
        <h3 key={`h3-${idx}`} className="font-semibold mb-1">
          {renderInline(h3[1])}
        </h3>
      );
      return;
    }

    // Unordered list items (- or *)
    const li = line.match(/^\s*[-*]\s+(.*)$/);
    if (li) {
      listBuffer.push(li[1]);
      return;
    }

    // Empty line: paragraph break
    if (line.trim().length === 0) {
      flushList();
      elements.push(<div key={`br-${idx}`} className="h-2" />);
      return;
    }

    // Regular paragraph line
    flushList();
    elements.push(<div key={`p-${idx}`}>{renderInline(line)}</div>);
  });

  flushList();
  return <>{elements}</>;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatBotProps {
  className?: string;
}

export default function ChatBot({ className }: ChatBotProps) {
  const { user } = useAuth();
  const buildGreeting = (name?: string) => {
    const display = name && name.trim() ? `${name}さん、こんにちは！` : 'こんにちは！';
    return `${display}Musubimeのサポートアシスタントです。インフルエンサーマーケティングキャンペーンに関するご質問にお答えします。何かお手伝いできることはありますか？`;
  };
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'greet',
      content: buildGreeting(user?.name),
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const ds = useDesignSystem();
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Quick question chips with expected inquiries for relevance matching
  const quickQuestions = [
    {
      label: '現在のステータスを教えて',
      keywords: ['ステータス', 'status', '進捗', '状況', 'どこまで', '現在', '今'],
    },
    {
      label: '次にやることは？',
      keywords: ['次', 'やること', 'todo', 'タスク', 'アクション', '何をすれば', 'どうすれば'],
    },
    {
      label: '提出が足りないものは？',
      keywords: ['提出', '足りない', '不足', '未提出', '残り', '必要', 'まだ'],
    },
    {
      label: '期限はいつ？',
      keywords: ['期限', '締切', 'いつまで', 'デッドライン', '日程', '予定日'],
    },
    {
      label: '遅れていることは？',
      keywords: ['遅れ', '遅延', '期限切れ', '過ぎた', '間に合わない'],
    },
    {
      label: '提出リンクを見せて',
      keywords: ['リンク', 'URL', 'フォーム', '提出先', 'どこに', '場所'],
    },
    {
      label: '支払い状況は？',
      keywords: ['支払い', '報酬', 'お金', '入金', '着金', '送金', '請求書'],
    },
    {
      label: '打ち合わせの予定は？',
      keywords: ['打ち合わせ', 'ミーティング', '会議', '面談', '相談', '話し合い'],
    },
    {
      label: '契約金額はいくら？',
      keywords: ['契約金額', '報酬', '料金', 'いくら', '金額', '価格'],
    },
    {
      label: '最新のフィードバックは？',
      keywords: ['フィードバック', '修正', '指摘', 'コメント', '意見', '改善点'],
    },
    {
      label: 'プラットフォームのガイドは？',
      keywords: ['ガイド', 'ガイドライン', 'やり方', '方法', 'プラットフォーム', 'YouTube', 'Instagram', 'TikTok'],
    },
    {
      label: 'ステータス一覧を見せて',
      keywords: ['ステータス一覧', '全ステータス', 'リスト', '種類', 'どんな'],
    },
    {
      label: '構成案のテンプレートは？',
      keywords: ['構成案', 'テンプレート', 'フォーマット', '作り方', '書き方', '例'],
    },
    {
      label: 'PR動画の注意点は？',
      keywords: ['PR', '注意', '気をつける', 'ルール', '禁止', 'NG', '動画'],
    },
    {
      label: 'アプリの撮影方法は？',
      keywords: ['撮影', 'デモ', '画面録画', 'アプリ', '使い方', '操作'],
    },
    {
      label: '概要欄に書く内容は？',
      keywords: ['概要欄', 'description', '説明文', '書く', '記載', 'テキスト'],
    },
    {
      label: '固定コメントの内容は？',
      keywords: ['固定コメント', 'コメント', 'ピン', '固定', '書く内容'],
    },
    {
      label: 'プロモーション設定の方法は？',
      keywords: ['プロモーション', '設定', 'ステマ', '広告表示', 'YouTube設定'],
    },
    {
      label: '訴求ポイントは？',
      keywords: ['訴求', 'アピール', '売り', '特徴', 'メリット', '良さ', '推し'],
    },
    {
      label: 'スピークの機能は？',
      keywords: ['機能', 'できること', 'feature', 'スピーク', 'アプリ', '使える'],
    }
  ];

  // Update greeting once user info becomes available
  useEffect(() => {
    if (!user?.name) return;
    setMessages(prev => {
      if (!prev.length || prev[0].id !== 'greet') return prev;
      const updated = [...prev];
      updated[0] = { ...updated[0], content: buildGreeting(user.name) };
      return updated;
    });
  }, [user?.name]);

  // Dynamic chip reordering based on user input
  const getRelevantQuestions = (input: string): typeof quickQuestions => {
    if (!input.trim()) return quickQuestions;
    
    const inputLower = input.toLowerCase();
    const scored = quickQuestions.map(q => {
      const matchCount = q.keywords.filter(keyword => 
        inputLower.includes(keyword.toLowerCase())
      ).length;
      return { ...q, score: matchCount };
    });
    
    // Sort by relevance score (descending), then by original order
    return scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return quickQuestions.indexOf(a) - quickQuestions.indexOf(b);
    });
  };

  const scrollToBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    try {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } catch {
      el.scrollTop = el.scrollHeight;
    }
  };

  useEffect(() => {
    // Keep view pinned to bottom as messages/loading change or panel opens
    scrollToBottom();
  }, [messages, isLoading, isOpen]);

  // Fetch campaigns for quick-answer computation
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        if (!user?.id) return;
        const res = await fetch(`/api/campaigns?userId=${encodeURIComponent(user.id)}`);
        if (!res.ok) return;
        const data: Campaign[] = await res.json();
        setCampaigns(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to fetch campaigns for quick answers', e);
      }
    };
    fetchCampaigns();
  }, [user?.id]);

  const toBool = (val?: string | null): boolean => {
    if (!val) return false;
    const v = String(val).trim().toLowerCase();
    return ['true', 'yes', '1', 'y', 'done', 'submitted', 'ok'].includes(v);
  };

  const getJapaneseStatus = (status: string): string => {
    const map: Record<string, string> = {
      not_started: '未開始',
      meeting_scheduling: '打ち合わせ予約中',
      meeting_scheduled: '打ち合わせ予定',
      contract_pending: '契約書待ち',
      plan_creating: '構成案作成中',
      plan_submitted: '構成案確認中',
      plan_revising: '構成案修正中',
      draft_creating: '初稿作成中',
      draft_submitted: '初稿提出済み',
      draft_revising: '初稿修正中',
      scheduling: '投稿準備中',
      scheduled: '投稿済み',
      payment_processing: '送金手続き中',
      completed: '完了',
      cancelled: 'キャンセル',
    };
    return map[status] || status;
  };

  const pickPrimaryCampaign = (list: Campaign[]): Campaign | undefined => {
    if (!list || list.length === 0) return undefined;
    const active = list.find(c => c.status !== 'completed' && c.status !== 'cancelled');
    return active || list[0];
  };

  const buildQuickAnswer = (label: string): string => {
    const primary = pickPrimaryCampaign(campaigns);
    if (!primary) {
      return user?.role === 'admin'
        ? 'キャンペーン一覧を取得できませんでした。管理画面を更新するか、フィルター条件をご確認ください。'
        : '現在のキャンペーン情報を取得できませんでした。ダッシュボードを更新してください。';
    }

    const status = String(primary.status) as CampaignStatus | string;
    const step = getStepFromStatus(status as CampaignStatus);
    const stepLabel = getStepLabel(step);
    const next = getNextStepInfo(status, primary.schedules || {} as any);

    if (label.includes('現在のステータス')) {
      const jpStatus = getJapaneseStatus(status);
      const platform = getPlatformLabel(String(primary.platform));
      const title = primary.title || 'キャンペーン';
      const dueText = next?.due ? buildDeadlineText(next.due) : '';
      const nextLine = next?.label
        ? `次のステップは「${next.label}」${dueText ? `で${dueText}` : 'です' }。`
        : '次のステップは確認中です。';

      return [
        `現在のステータスは「${jpStatus}」です。`,
        nextLine,
        '',
        `- キャンペーン: ${title}`,
        `- プラットフォーム: ${platform}`,
        `- ステップ: ${stepLabel}`,
      ].join('\n');
    }

    if (label.includes('次にやること')) {
      const d = primary.campaignData || {};
      const links: string[] = [];
      if (d.url_main_form) links.push(`- 基本情報フォーム: [開く](${d.url_main_form})`);
      // Append guideline link based on platform
      const p = (primary.platform || '').toLowerCase();
      let guidelineUrl = '';
      if (p === 'youtube_long' || p === 'yt') {
        guidelineUrl = 'https://usespeak.notion.site/YouTube-4-0-5b88f1ad34ed45f3aaeca324af039665?source=copy_link';
      } else if ([
        'youtube_short', 'short_video', 'instagram_reel', 'tiktok', 'sv', 'tt', 'yts', 'igr'
      ].includes(p)) {
        guidelineUrl = 'https://usespeak.notion.site/1b3792ec2f10800f9f94e476a87c06f1?source=copy_link';
      } else if (p === 'podcast' || p === 'pc') {
        guidelineUrl = 'https://usespeak.notion.site/Podcast-224792ec2f1080f2a7d5fce804ce4b93?source=copy_link';
      } else if ([
        'x_twitter', 'twitter', 'tw', 'x'
      ].includes(p)) {
        guidelineUrl = 'https://usespeak.notion.site/X-1e111dbf830946a4a225c26a2c6deede?source=copy_link';
      }
      if (guidelineUrl) links.push(`- ガイドライン: [開く](${guidelineUrl})`);
      if (d.url_plan) links.push(`- 構成案URL: [開く](${d.url_plan})`);
      if (d.url_draft) links.push(`- 初稿URL: [開く](${d.url_draft})`);
      if (d.url_content) links.push(`- 公開URL: [開く](${d.url_content})`);
      if (d.url_payout_form) links.push(`- 支払いフォーム: [開く](${d.url_payout_form})`);

      const dueText = next?.due ? buildDeadlineText(next.due) : '';

      const actionMap: Record<string, string[]> = {
        not_started: [
          'ダッシュボードから基本情報フォームを入力',

        ],
        meeting_scheduling: [
          '候補日時を確認して予約を確定',
          '確定後にダッシュボードで「予約済み」に更新',
        ],
        meeting_scheduled: [
          '打ち合わせ実施の準備',
          '実施後、構成案の作成を開始',
        ],
        trial: [
          'ガイドラインを確認',
          'ダッシュボード下部のプレミアムアカウントでログインして試用',
          '完了したら「次のステップへ」をタップ（ダッシュボード）',
        ],
        contract_pending: [
          'ガイドラインを確認',
          'ダッシュボード下部のプレミアムアカウントでログインして試用',
        ],
        plan_creating: [
          '構成案を作成し、共有URLをダッシュボードに提出',
        ],
        plan_submitted: [
          '承認待ち。フィードバックが届いたら修正対応',
          '並行して初稿の準備を開始',
        ],
        plan_revising: [
          'フィードバックに沿って構成案を修正',
          '修正後に再提出',
        ],
        draft_creating: [
          '初稿を作成し、共有URLを提出',
        ],
        draft_submitted: [
          '承認待ち。必要に応じて修正に備える',
          '公開日時や要件を確認',
        ],
        draft_revising: [
          'フィードバックに沿って初稿を修正',
          '修正後に再提出',
        ],
        scheduling: [
          '指定の日時に合わせて公開',
          '概要欄・固定コメントの文言を反映',
        ],
        scheduled: [
          '公開URLを提出',
          '支払いフォームの手続き',
        ],
        payment_processing: [
          '着金を確認したらダッシュボードで完了報告',
        ],
        completed: ['対応は完了しています'],
        cancelled: ['キャンセル済みです'],
      };

      const actions = actionMap[status] || ['次のアクションは確認中です'];

      return [
        next?.label ? `次のステップは「${next.label}」${dueText ? `で${dueText}` : 'です'}。` : '次のステップは確認中です。',
        '',
        '**やること**:',
        ...actions.map(a => `- ${a}`),
        links.length ? '\n**関連リンク**:' : '',
        ...(links.length ? links : []),
      ].filter(Boolean).join('\n');
    }

    if (label.includes('提出が足りない')) {
      const d = primary.campaignData || {};
      const missing: string[] = [];
      if (!toBool(d.contract_form_submitted)) missing.push('基本情報入力');
      if (!toBool(d.plan_submitted)) missing.push('構成案');
      if (!toBool(d.draft_submitted)) missing.push('初稿');
      if (!toBool(d.live_video_submitted) && !d.url_content) missing.push('ライブ動画URL');
      if (!toBool(d.payout_form_submitted)) missing.push('支払いフォーム');

      const links: string[] = [];
      if (d.url_main_form) links.push(`- 基本情報入力: [リンク](${d.url_main_form})`);
      if (d.url_plan) links.push(`- 構成案: [リンク](${d.url_plan})`);
      if (d.url_draft) links.push(`- 初稿: [リンク](${d.url_draft})`);
      if (d.url_content) links.push(`- コンテンツ: [リンク](${d.url_content})`);
      if (d.url_payout_form) links.push(`- 支払いフォーム: [リンク](${d.url_payout_form})`);

      if (missing.length === 0) {
        return '不足している提出物はありません。必要に応じてメッセージでご連絡ください。';
      }
      return `不足している提出物:\n- ${missing.join('\n- ')}${links.length ? `\n\n関連リンク:\n${links.join('\n')}` : ''}`;
    }

    // Deadlines overview
    if (label.includes('期限')) {
      const s = primary.schedules || {};
      const entries: string[] = [];
      const md = parseDate(s.meetingDate || undefined);
      const pd = parseDate(s.planSubmissionDate || undefined);
      const dd = parseDate(s.draftSubmissionDate || undefined);
      const ld = parseDate(s.liveDate || undefined);
      if (md) entries.push(`- 打ち合わせ: ${buildDeadlineText(md)}`);
      if (pd) entries.push(`- 構成案提出: ${buildDeadlineText(pd)}`);
      if (dd) entries.push(`- 初稿提出: ${buildDeadlineText(dd)}`);
      if (ld) entries.push(`- 公開: ${buildDeadlineText(ld)}`);
      if (entries.length === 0) return '期限情報が見つかりませんでした。ダッシュボードのスケジュール欄をご確認ください。';
      return ['### 期限の一覧', ...entries].join('\n');
    }

    // Overdue items
    if (label.includes('遅れている') || label.includes('遅れ')) {
      const s = primary.schedules || {};
      const d = primary.campaignData || {} as any;
      const overdue: string[] = [];
      const isPast = (dt: Date | null) => !!dt && daysBetweenToday(dt) < 0;
      const md = parseDate(s.meetingDate || undefined);
      const pd = parseDate(s.planSubmissionDate || undefined);
      const dd = parseDate(s.draftSubmissionDate || undefined);
      const ld = parseDate(s.liveDate || undefined);
      if (isPast(md) && primary.meetingStatus !== 'completed') overdue.push(`- 打ち合わせ（${buildDeadlineText(md as Date)}）`);
      if (isPast(pd) && !toBool(d.plan_submitted)) overdue.push(`- 構成案提出（${buildDeadlineText(pd as Date)}）`);
      if (isPast(dd) && !toBool(d.draft_submitted)) overdue.push(`- 初稿提出（${buildDeadlineText(dd as Date)}）`);
      if (isPast(ld) && !toBool(d.live_video_submitted) && !d.url_content) overdue.push(`- 公開（${buildDeadlineText(ld as Date)}）`);
      if (overdue.length === 0) return '現在、遅れている項目はありません。';
      return ['遅延中の項目:', ...overdue].join('\n');
    }

    // Submission links
    if (label.includes('提出リンク') || label.includes('リンク')) {
      const d = primary.campaignData || {};
      const links: string[] = [];
      if (d.url_main_form) links.push(`- 基本情報フォーム: [開く](${d.url_main_form})`);
      if (d.url_plan) links.push(`- 構成案: [開く](${d.url_plan})`);
      if (d.url_draft) links.push(`- 初稿: [開く](${d.url_draft})`);
      if (d.url_content) links.push(`- 公開URL: [開く](${d.url_content})`);
      if (d.url_payout_form) links.push(`- 支払いフォーム: [開く](${d.url_payout_form})`);
      return links.length ? ['### 提出リンク', ...links].join('\n') : '提出リンクは未登録です。';
    }

    // Payment status
    if (label.includes('支払い状況') || label.includes('支払い')) {
      const d = primary.campaignData || {} as any;
      const payoutFormSubmitted = toBool(d.payout_form_submitted);
      const payoutDone = toBool(d.payout_done);
      const statusText = payoutDone
        ? '着金済み'
        : payoutFormSubmitted
          ? '送金手続き中'
          : '未着手（支払いフォーム未提出）';
      const link = d.url_payout_form ? `\n- 支払いフォーム: [開く](${d.url_payout_form})` : '';
      return `支払い状況: ${statusText}${link}`;
    }

    // Meeting schedule
    if (label.includes('打ち合わせ')) {
      const s = primary.schedules || {};
      const md = parseDate(s.meetingDate || undefined);
      const statusText = primary.meetingStatus || 'not_scheduled';
      const link = primary.meetingLink ? `\n- 参加リンク: [開く](${primary.meetingLink})` : '';
      if (!md) return `打ち合わせは未予約です（ステータス: ${statusText}）。${link}`.trim();
      return [`打ち合わせ: ${formatMonthDay(md)} 予定`, buildDeadlineText(md), link].filter(Boolean).join('\n');
    }

    // Reward amount
    if (label.includes('契約金額') || label.includes('報酬')) {
      const formatAmount = (amount: number | null, currency?: string) => {
        if (typeof amount !== 'number') return '未設定';
        if (!currency || currency.toUpperCase() === 'JPY' || currency === '¥') {
          return `¥${amount.toLocaleString('ja-JP')}`;
        }
        return `${currency} ${amount.toLocaleString('en-US')}`;
      };
      return `契約金額: ${formatAmount(primary.contractedPrice, primary.currency)}`;
    }

    // Latest feedback
    if (label.includes('フィードバック')) {
      const msg = extractLatestRevisionFeedback(primary.campaignData?.message_dashboard);
      return msg ? `最新のフィードバック:\n${msg}` : '最新の修正フィードバックは見つかりませんでした。';
    }

    // Platform guide
    if (label.includes('ガイド')) {
      const platformKey = String(primary.platform || '').toLowerCase();
      const common = [
        '- 提出前にリンクの公開設定をご確認ください',
        '- 指定テキストやハッシュタグの反映をお願いします',
      ];
      let guide: string[] = [];
      if (platformKey.includes('youtube')) {
        guide = [
          '- 概要欄に指定文言を追加',
          '- 固定コメントを設定',
          '- 視聴者に自然に訴求',
        ];
      } else if (platformKey.includes('instagram') || platformKey.includes('reel')) {
        guide = [
          '- キャプションに指定文言を追加',
          '- ストーリーズでの追従も歓迎',
        ];
      } else if (platformKey.includes('tiktok')) {
        guide = [
          '- キャプションと動画内テロップで訴求',
          '- 視聴完了率を意識した構成',
        ];
      } else if (platformKey.includes('x_twitter') || platformKey.includes('twitter') || platformKey === 'x') {
        guide = [
          '- 固定ポストやスレッドでの訴求',
          '- クリック導線の明確化',
        ];
      } else {
        guide = ['- 企画意図が伝わるように構成してください'];
      }
      return ['### プラットフォームガイド', ...guide, ...common].join('\n');
    }

    // All statuses list
    if (label.includes('ステータス一覧') || label.includes('ステータスの一覧')) {
      const allStatuses: string[] = [
        'not_started','meeting_scheduling','meeting_scheduled','plan_creating','plan_submitted','plan_revising','draft_creating','draft_submitted','draft_revising','scheduling','scheduled','payment_processing','completed','cancelled'
      ];
      const lines = allStatuses.map(key => `- ${getJapaneseStatus(key)}`);
      return ['### ステータス一覧', ...lines].join('\n');
    }

    // Guideline-related questions
    if (label.includes('構成案のテンプレート')) {
      return [
        '### 構成案のテンプレート',
        '構成案は以下のテンプレートをご利用ください：',
        '',
        '- [構成案テンプレート](https://docs.google.com/document/d/13Ljg7rR8hsaZflGt3N0sB_g9ad-391G7Nhl4ICwVybg/copy)',
        '',
        '**構成に含める要素**：',
        '- 文脈づくり（英語に関する話題）',
        '- PR導入（自然にスピークを紹介）',
        '- 訴求ポイント',
        '- アプリ利用デモ',
        '- アクションコール（概要欄・コメント確認の呼びかけ）',
      ].join('\n');
    }

    if (label.includes('PR動画の注意点')) {
      return [
        '### PR動画の注意事項',
        '',
        '**必須項目**：',
        '- アプリ画面を直接映すか画面録画を含める',
        '- 「スピーク」（カタカナ）で統一',
        '- 指定リンクをプロフィールに2週間掲載',
        '- 固定コメントと概要欄に指定内容を記載',
        '- プロモーション表示設定',
        '- 概要欄に#prを記載',
        '',
        '**コンテンツのポイント**：',
        '- 普段通りのフォーマットで制作',
        '- 視聴者が楽しめる・役立つ内容',
        '- 視聴維持率を意識した構成',
      ].join('\n');
    }

    if (label.includes('アプリの撮影方法')) {
      return [
        '### アプリ撮影方法',
        '',
        '**基本の撮影手順**：',
        '1. フリートークからトピックを作成してAIと英会話',
        '2. 会話中の修正点を確認',
        '',
        '**その他の機能**：',
        '- ビデオレッスン',
        '- スピーキングドリル',
        '- メイドフォーユー（AI生成レッスン）',
        '- 英会話シナリオの作成',
        '- AIフィードバックの確認',
        '',
        '詳細は撮影手順ドキュメントをご確認ください。',
      ].join('\n');
    }

    if (label.includes('概要欄に書く内容')) {
      return [
        '### 概要欄の記載内容',
        '',
        '**必須項目**：',
        '- 指定されたスピークのPRリンク',
        '- #pr のハッシュタグ',
        '- 指定のPR文言',
        '',
        '**注意点**：',
        '- 固定コメントと概要欄の両方に記載',
        '- リンクは必ず含める',
        '- 具体的な文言は個別に共有されます',
      ].join('\n');
    }

    if (label.includes('固定コメントの内容')) {
      return [
        '### 固定コメントの内容',
        '',
        '**設定方法**：',
        '- コメントを投稿後に固定設定',
        '- 「もっと見る」を押さなくても見える長さに',
        '',
        '**記載内容**：',
        '- 指定されたPR文言',
        '- スピークのリンク',
        '- 概要欄と同じ内容',
        '',
        '具体的な文言は個別にお送りします。',
      ].join('\n');
    }

    if (label.includes('プロモーション設定')) {
      return [
        '### プロモーション設定方法',
        '',
        '**YouTube での設定**：',
        '1. YouTube Studio にアクセス',
        '2. 動画の詳細設定を開く',
        '3. 「有料プロモーション」にチェック',
        '4. 保存',
        '',
        '**設定理由**：',
        '- ステマ防止のため必須',
        '- 透明性の確保',
        '',
        '[設定方法の詳細](https://support.google.com/youtube/answer/154235)',
      ].join('\n');
    }

    if (label.includes('訴求ポイント')) {
      const platform = getPlatformLabel(String(primary?.platform));
      return [
        '### スピークの訴求ポイント',
        '',
        '**主要な特徴**：',
        '- **心理的ハードルが低い** - AIなので緊張せず失敗を恐れない',
        '- **とにかく手軽** - アプリですぐに英語を話し始められる',
        '- **スピーキングに完全特化** - 話す力の向上に最適',
        '- **コスパが高い** - 月1000円台から無制限で話し放題',
        '- **世界最高峰のテクノロジー** - OpenAIから投資された最新AI',
        '',
        `**${platform}での訴求のコツ**：`,
        '- 視聴者の属性に合わせて組み合わせる',
        '- 素直な感想やリアクションも含める',
        '- 自然な流れで紹介する',
      ].join('\n');
    }

    if (label.includes('スピークの機能')) {
      return [
        '### スピークの主な機能',
        '',
        '**学習の流れ**：',
        '1. **学ぶ** - ビデオレッスンでインプット',
        '2. **練習する** - スピーキング練習で反復',
        '3. **実践する** - AIとのフリートークで実践',
        '',
        '**主要機能**：',
        '- ホームタブ（コースの時系列表示）',
        '- ビデオレッスン',
        '- 英会話シナリオの作成',
        '- AIフィードバック（リアルタイム修正）',
        '- メイドフォーユー（AI生成個別レッスン）',
        '- スピーキングドリル',
        '- フリートーク設定',
      ].join('\n');
    }

    return 'このクイック質問はローカル自動回答に未対応です。';
  };

  const handleQuickChipClick = (label: string) => {
    // Append user message
    const userMessage: Message = {
      id: `${Date.now()}_quick_user`,
      content: label,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    scrollToBottom();

    // Compute local answer and append bot message
    const answer = buildQuickAnswer(label);
    addBotMessageWithTyping(answer);
  };

  // Add a bot message with typewriter animation
  const addBotMessageWithTyping = (text: string) => {
    const id = `${Date.now()}_bot_typing`;
    const initial: Message = {
      id,
      content: '',
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, initial]);
    scrollToBottom();

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    setIsTyping(true);
    let index = 0;
    const step = 2; // characters per tick
    const interval = setInterval(() => {
      index = Math.min(text.length, index + step);
      const partial = text.slice(0, index);
      setMessages(prev => prev.map(m => (m.id === id ? { ...m, content: partial } : m)));
      scrollToBottom();
      if (index >= text.length) {
        clearInterval(interval);
        typingIntervalRef.current = null;
        setIsTyping(false);
      }
    }, 16);

    typingIntervalRef.current = interval as unknown as NodeJS.Timeout;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    scrollToBottom();

    try {
      // Send message to AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          userId: user?.id,
          userRole: user?.role,
          userName: user?.name,
          source: 'typed',
          conversationHistory: messages.slice(-5), // Send last 5 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      addBotMessageWithTyping(data.response);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'すみません、現在サービスに接続できません。しばらくしてからもう一度お試しください。',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      scrollToBottom();
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Don't show chatbot for unauthenticated users or admin role
  if (!user || user.role === 'admin') {
    return null;
  }

  if (!isOpen) {
    return (
      <div className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[60] ${className || ''}`}>
        <button
          onClick={() => setIsOpen(true)}
          className="group relative w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
          style={{
            backgroundColor: ds.button.primary.bg,
            color: ds.button.primary.text,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = ds.button.primary.hover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = ds.button.primary.bg;
          }}
        >
          <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          
          {/* Pulse animation */}
          <div 
            className="absolute inset-0 rounded-full animate-pulse opacity-20"
            style={{ backgroundColor: ds.button.primary.bg }}
          />
          
          {/* Tooltip */}
          <div 
            className="absolute bottom-full right-0 mb-2 px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
            style={{
              backgroundColor: ds.bg.surface,
              color: ds.text.primary,
              borderColor: ds.border.primary,
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
          >
            AIアシスタントに質問する
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[60] ${className || ''}`}>
      <div 
        className="w-[calc(100vw-2rem)] max-w-sm sm:w-96 h-[70vh] max-h-[32rem] sm:h-[32rem] rounded-2xl shadow-2xl flex flex-col overflow-hidden mobile-chat-container"
        style={{
          backgroundColor: ds.bg.card,
          borderColor: ds.border.primary,
          borderWidth: '1px',
          borderStyle: 'solid',
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-3 sm:p-4 border-b"
          style={{
            backgroundColor: ds.bg.surface,
            borderColor: ds.border.secondary,
          }}
        >
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div 
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: ds.button.primary.bg }}
            >
              <Bot className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: ds.button.primary.text }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: ds.text.primary }}>
                Musubime AI
              </h3>
              <p className="text-xs" style={{ color: ds.text.secondary }}>
                オンライン
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg hover:bg-opacity-80 transition-colors"
            style={{ color: ds.text.secondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = ds.bg.surface;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>



        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 mobile-chat-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-2 ${
                message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: message.sender === 'user' 
                    ? ds.text.accent 
                    : ds.button.primary.bg,
                }}
              >
                {message.sender === 'user' ? (
                  <User className="w-3 h-3" style={{ color: 'white' }} />
                ) : (
                  <Bot className="w-3 h-3" style={{ color: ds.button.primary.text }} />
                )}
              </div>
              
              <div className={`flex-1 max-w-[85%] sm:max-w-[80%] ${message.sender === 'user' ? 'text-right' : ''}`}>
                <div
                  className={`inline-block px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    message.sender === 'user' 
                      ? 'rounded-br-md' 
                      : 'rounded-bl-md'
                  }`}
                  style={{
                    backgroundColor: message.sender === 'user' 
                      ? ds.text.accent 
                      : ds.bg.surface,
                    color: message.sender === 'user' 
                      ? 'white' 
                      : ds.text.primary,
                  }}
                >
                  {renderMarkdown(message.content)}
                </div>
                <div 
                  className={`text-xs mt-1 ${message.sender === 'user' ? 'text-right' : ''}`}
                  style={{ color: ds.text.secondary }}
                >
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start space-x-2">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: ds.button.primary.bg }}
              >
                <Bot className="w-3 h-3" style={{ color: ds.button.primary.text }} />
              </div>
              <div
                className="inline-block px-3 py-2 rounded-2xl rounded-bl-md"
                style={{
                  backgroundColor: ds.bg.surface,
                  color: ds.text.primary,
                }}
              >
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </div>

        {/* Quick prompt chips (above input area, hidden during AI response) */}
        {!isLoading && !isTyping && (
          <div className="px-3 sm:px-4 py-2">
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide">
              {getRelevantQuestions(inputValue).slice(0, 6).map((question) => (
                <button
                  key={question.label}
                  onClick={() => handleQuickChipClick(question.label)}
                  className="flex-shrink-0 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs transition-colors whitespace-nowrap"
                  style={{ 
                    backgroundColor: ds.bg.card, 
                    color: ds.text.primary, 
                    borderColor: ds.border.primary, 
                    borderWidth: '1px', 
                    borderStyle: 'solid' 
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = ds.bg.surface;
                    e.currentTarget.style.borderColor = ds.text.accent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = ds.bg.card;
                    e.currentTarget.style.borderColor = ds.border.primary;
                  }}
                >
                  {question.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div 
          className="p-3 sm:p-4 border-t"
          style={{ borderColor: ds.border.secondary }}
        >
          <div className="flex items-end space-x-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="メッセージを入力..."
              className="flex-1 resize-none rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-20 min-h-[2.5rem]"
              style={{
                backgroundColor: ds.form.input.bg,
                borderColor: ds.form.input.border,
                color: ds.text.primary,
                borderWidth: '1px',
                borderStyle: 'solid',
              }}
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="p-2 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
              style={{
                backgroundColor: ds.button.primary.bg,
                color: ds.button.primary.text,
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = ds.button.primary.hover;
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = ds.button.primary.bg;
                }
              }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
