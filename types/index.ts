export type UserRole = 'influencer' | 'admin';

export type Platform = 
  | 'youtube_long'
  | 'youtube_short' 
  | 'instagram_reel'
  | 'tiktok'
  | 'x_twitter'
  | 'podcast'
  | 'blog';

export type CampaignStatus = 
  | 'meeting_scheduling'    // 打ち合わせ予約中
  | 'meeting_scheduled'     // 打ち合わせ予約済み
  | 'plan_creating'         // 構成案作成中
  | 'plan_submitted'        // 構成案提出済み
  | 'plan_reviewing'        // 構成案確認中
  | 'plan_revising'         // 構成案修正中
  | 'draft_creating'        // 初稿作成中
  | 'draft_submitted'       // 初稿提出済み
  | 'draft_reviewing'       // 初稿確認中
  | 'draft_revising'        // 初稿修正中
  | 'scheduling'            // 投稿準備中
  | 'scheduled'             // 投稿済み
  | 'payment_processing'    // 送金手続き中
  | 'completed'             // PR完了
  | 'cancelled';            // PRキャンセル

export type CampaignStep = 
  | 'meeting'               // 打ち合わせ
  | 'plan_creation'         // 構成案作成
  | 'draft_creation'        // 初稿作成
  | 'scheduling'            // スケジュール
  | 'payment'               // お支払い
  | 'cancelled';            // キャンセル

// Map status to step
export const getStepFromStatus = (status: CampaignStatus): CampaignStep => {
  switch (status) {
    case 'meeting_scheduling':
    case 'meeting_scheduled':
      return 'meeting';
    case 'plan_creating':
    case 'plan_submitted':
    case 'plan_reviewing':
    case 'plan_revising':
      return 'plan_creation';
    case 'draft_creating':
    case 'draft_submitted':
    case 'draft_reviewing':
    case 'draft_revising':
      return 'draft_creation';
    case 'scheduling':
    case 'scheduled':
      return 'scheduling';
    case 'payment_processing':
    case 'completed':
      return 'payment';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'meeting';
  }
};

// Get step order for progress calculation
export const getStepOrder = (): CampaignStep[] => [
  'meeting',
  'plan_creation', 
  'draft_creation',
  'scheduling',
  'payment'
];

// Get step label
export const getStepLabel = (step: CampaignStep): string => {
  switch (step) {
    case 'meeting': return '打ち合わせ';
    case 'plan_creation': return '構成案作成';
    case 'draft_creation': return '初稿作成';
    case 'scheduling': return 'スケジュール';
    case 'payment': return 'お支払い';
    case 'cancelled': return 'キャンセル';
    default: return '不明';
  }
};

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  statusDashboard?: string;
}

export interface Campaign {
  id: string;
  influencerId: string;
  influencerName: string;
  influencerAvatar?: string;
  title: string;
  platform: Platform | string;
  status: CampaignStatus | string;
  contractedPrice: number | null;
  currency: string;
  schedules: {
    meetingDate?: string | null;
    planSubmissionDate?: string | null;
    draftSubmissionDate?: string | null;
    liveDate?: string | null;
  };
  requirements: string[];
  referenceLinks: Array<{
    title: string;
    url: string;
  }>;
  notes?: string;
  meetingLink?: string;
  meetingCompleted?: boolean;
  meetingStatus?: 'not_scheduled' | 'scheduling' | 'scheduled' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface Update {
  id: string;
  campaignId: string;
  influencerId: string;
  influencerName: string;
  type: 'status_change' | 'submission' | 'approval' | 'message';
  message: string;
  timestamp: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
