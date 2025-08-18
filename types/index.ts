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
  | 'meeting_scheduled'     // 打ち合わせ予定
  | 'plan_submission'       // 構成案提出待ち
  | 'plan_revision'         // 構成案修正待ち
  | 'plan_review'          // 構成案確認中
  | 'content_creation'     // コンテンツ制作中
  | 'draft_submitted'      // 初稿提出済み
  | 'draft_revision'       // 初稿修正待ち
  | 'draft_review'         // 初稿確認中
  | 'ready_to_publish'     // 投稿準備完了
  | 'live'                 // 投稿済み
  | 'payment_processing'   // 送金手続き中
  | 'completed'            // 完了
  | 'cancelled';           // キャンセル

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
  meetingStatus?: 'not_scheduled' | 'scheduled' | 'completed';
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
