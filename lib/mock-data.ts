import { User, Campaign, Update, CampaignStatus, Platform } from '@/types';

export const mockUsers: User[] = [
  {
    id: 'actre_vlog_yt',
    email: 'actre@example.com',
    name: '田中さら',
    role: 'influencer',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    statusDashboard: 'plan_submission'
  },
  {
    id: 'eigatube_yt',
    email: 'eigatube@example.com',
    name: '山田けん',
    role: 'influencer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    statusDashboard: 'plan_review'
  },
  {
    id: 'admin',
    email: 'admin@usespeak.com',
    name: 'スピーク運営',
    role: 'admin',
    statusDashboard: 'active'
  }
];

export const mockCampaigns: Campaign[] = [
  {
    id: '1',
    influencerId: 'actre_vlog_yt',
    influencerName: '田中さら',
    influencerAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    title: 'スピーク英会話アプリPR - YouTubeショート',
    platform: 'youtube_short',
    status: 'plan_submission',
    contractedPrice: 50000,
    currency: 'JPY',
    schedules: {
      meetingDate: '2024-01-10',
      planSubmissionDate: '2024-01-15',
      draftSubmissionDate: '2024-01-25',
      liveDate: '2024-02-01'
    },
    requirements: [
      'アプリの画面録画を含める',
      'AIとの英会話シーンを撮影',
      'フィードバック機能を紹介',
      '概要欄と固定コメントに特別リンクを記載',
      'プロモーション設定を有効にする'
    ],
    referenceLinks: [
      {
        title: 'スピーク機能一覧',
        url: 'https://www.notion.so/usespeak/1b5792ec2f1080218ab4ca2fd5ac5832'
      },
      {
        title: '撮影手順ガイド',
        url: 'https://www.notion.so/1b3792ec2f108154bd70e22245aa9e97'
      }
    ],
    notes: 'フォロワーが英語学習に興味のある層なので、学習効果を重点的にアピール',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '2',
    influencerId: 'eigatube_yt',
    influencerName: '山田けん',
    influencerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    title: 'スピーク英会話アプリPR - YouTube長編',
    platform: 'youtube_long',
    status: 'plan_review',
    contractedPrice: 80000,
    currency: 'JPY',
    schedules: {
      meetingDate: '2024-01-05',
      planSubmissionDate: '2024-01-12',
      draftSubmissionDate: '2024-01-30',
      liveDate: '2024-02-05'
    },
    requirements: [
      '詳細なアプリデモを含める',
      'AIとの自由会話を実演',
      'メイドフォーユー機能を紹介',
      'OpenAI投資の話題を含める',
      '動画開始20%以内にPR挿入'
    ],
    referenceLinks: [
      {
        title: 'YouTube長編ガイドライン',
        url: 'https://www.notion.so/YouTube-4-0-5b88f1ad34ed45f3aaeca324af039665'
      },
      {
        title: '構成案テンプレート',
        url: 'https://docs.google.com/document/d/13Ljg7rR8hsaZflGt3N0sB_g9ad-391G7Nhl4ICwVybg/copy'
      }
    ],
    notes: '海外旅行系チャンネルなので旅行シーンでの英会話を文脈として使用',
    createdAt: new Date('2023-12-15'),
    updatedAt: new Date('2024-01-12')
  },
  {
    id: '3',
    influencerId: '1',
    influencerName: '田中さら',
    influencerAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    title: 'スピーク英会話アプリPR - Instagramリール',
    platform: 'instagram_reel',
    status: 'completed',
    contractedPrice: 35000,
    currency: 'JPY',
    schedules: {
      meetingDate: '2023-11-20',
      planSubmissionDate: '2023-12-01',
      draftSubmissionDate: '2023-12-15',
      liveDate: '2023-12-20'
    },
    requirements: [
      'ショート動画形式で制作',
      '@speak_jpと共同投稿',
      'プロフィールに2週間リンク掲載',
      'ハッシュタグ #pr を記載'
    ],
    referenceLinks: [
      {
        title: 'ショート動画ガイドライン',
        url: 'https://www.notion.so/1b3792ec2f10800f9f94e476a87c06f1'
      }
    ],
    notes: '完了済み - 非常に良いパフォーマンスでした',
    meetingCompleted: true,
    createdAt: new Date('2023-11-15'),
    updatedAt: new Date('2023-12-20')
  },
  {
    id: '4',
    influencerId: 'actre_vlog_yt',
    influencerName: '田中さら',
    influencerAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    title: 'スピーク英会話アプリPR - TikTok',
    platform: 'tiktok',
    status: 'meeting_scheduled',
    contractedPrice: 45000,
    currency: 'JPY',
    schedules: {
      meetingDate: '2024-02-15',
      planSubmissionDate: '2024-02-20',
      draftSubmissionDate: '2024-03-01',
      liveDate: '2024-03-10'
    },
    requirements: [
      'TikTokトレンドに合わせた動画制作',
      'AIとの英会話シーンを撮影',
      'フィードバック機能を紹介',
      'プロフィールにリンク掲載',
      'ハッシュタグ #speak #英会話 を記載'
    ],
    referenceLinks: [
      {
        title: 'TikTok制作ガイドライン',
        url: 'https://www.notion.so/1b3792ec2f10800f9f94e476a87c06f1'
      }
    ],
    notes: 'TikTok初回プロモーション - フォロワー層に合わせた内容で制作',
              meetingLink: 'https://calendly.com/speak-naoki/30min-1',
          meetingCompleted: false,
          meetingStatus: 'not_scheduled',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25')
  }
];

export const mockUpdates: Update[] = [
  {
    id: '1',
    campaignId: '1',
    influencerId: '1',
    influencerName: '田中さら',
    type: 'submission',
    message: '田中さらさんから初稿動画が提出されました',
    timestamp: new Date('2024-01-20T10:30:00')
  },
  {
    id: '2',
    campaignId: '2',
    influencerId: '2',
    influencerName: '山田けん',
    type: 'approval',
    message: '山田けんさんの構成案を確認中です',
    timestamp: new Date('2024-01-12T14:15:00')
  },
  {
    id: '3',
    campaignId: '3',
    influencerId: '1',
    influencerName: '田中さら',
    type: 'status_change',
    message: '田中さらさんのInstagramリールが投稿されました！',
    timestamp: new Date('2023-12-20T09:00:00')
  }
];

export const getStatusLabel = (status: CampaignStatus): string => {
  const statusLabels: Record<CampaignStatus, string> = {
    meeting_scheduled: '打ち合わせ予定',
    plan_submission: '構成案提出待ち',
    plan_revision: '構成案修正待ち',
    plan_review: '構成案確認中',
    content_creation: 'コンテンツ制作中',
    draft_submitted: '初稿提出済み',
    draft_revision: '初稿修正待ち',
    draft_review: '初稿確認中',
    ready_to_publish: '投稿準備完了',
    live: '投稿済み',
    payment_processing: '送金手続き中',
    completed: '完了',
    cancelled: 'キャンセル'
  };
  return statusLabels[status];
};

export const getStatusColor = (status: CampaignStatus): string => {
  const statusColors: Record<CampaignStatus, string> = {
    meeting_scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    plan_submission: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    plan_revision: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    plan_review: 'bg-orange-600/20 text-orange-300 border-orange-600/30',
    content_creation: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    draft_submitted: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    draft_revision: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    draft_review: 'bg-indigo-600/20 text-indigo-300 border-indigo-600/30',
    ready_to_publish: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    live: 'bg-green-600/20 text-green-300 border-green-600/30',
    payment_processing: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30'
  };
  return statusColors[status];
};

export const getNextStep = (status: CampaignStatus): string => {
  const nextSteps: Record<CampaignStatus, string> = {
    meeting_scheduled: '打ち合わせにご参加ください',
    plan_submission: '構成案をご提出ください',
    plan_revision: '修正版構成案をご提出ください',
    plan_review: '構成案の確認をお待ちください',
    content_creation: 'コンテンツの制作を開始してください',
    draft_submitted: '初稿の確認をお待ちください',
    draft_review: '修正があれば対応してください',
    ready_to_publish: 'コンテンツを投稿してください',
    live: '送金手続きをお待ちください',
    payment_processing: 'お支払い処理中です',
    completed: 'プロモーション完了',
    cancelled: 'キャンペーンキャンセル済み'
  };
  return nextSteps[status];
};

export const getPlatformLabel = (platform: Platform): string => {
  const platformLabels: Record<Platform, string> = {
    youtube_long: 'YouTube長編',
    youtube_short: 'YouTubeショート',
    instagram_reel: 'Instagramリール',
    tiktok: 'TikTok',
    x_twitter: 'X (Twitter)',
    podcast: 'ポッドキャスト',
    blog: 'ブログ'
  };
  return platformLabels[platform];
};

export const getPlatformIcon = (platform: Platform): string => {
  const platformIcons: Record<Platform, string> = {
    youtube_long: '🎥',
    youtube_short: '📱',
    instagram_reel: '📸',
    tiktok: '🎵',
    x_twitter: '🐦',
    podcast: '🎙️',
    blog: '✍️'
  };
  return platformIcons[platform];
};
