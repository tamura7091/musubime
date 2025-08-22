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
  | 'not_started'           // 未開始
  | 'meeting_scheduling'    // 打ち合わせ予約中
  | 'meeting_scheduled'     // 打ち合わせ予約済み
  | 'plan_creating'         // 構成案作成中
  | 'plan_submitted'        // 構成案提出済み
  | 'plan_revising'         // 構成案修正中
  | 'draft_creating'        // 初稿作成中
  | 'draft_submitted'       // 初稿提出済み
  | 'draft_revising'        // 初稿修正中
  | 'scheduling'            // 投稿準備中
  | 'scheduled'             // 投稿済み
  | 'payment_processing'    // 送金手続き中
  | 'completed'             // PR完了
  | 'cancelled';            // PRキャンセル

export type CampaignStep = 
  | 'not_started'           // 未開始
  | 'meeting'               // 打ち合わせ
  | 'plan_creation'         // 構成案作成
  | 'draft_creation'        // 初稿作成
  | 'scheduling'            // スケジュール
  | 'payment'               // お支払い
  | 'cancelled';            // キャンセル

// Map status to step
export const getStepFromStatus = (status: CampaignStatus): CampaignStep => {
  switch (status) {
    case 'not_started':
      return 'not_started';
    case 'meeting_scheduling':
    case 'meeting_scheduled':
      return 'meeting';
    case 'plan_creating':
    case 'plan_submitted':
    case 'plan_revising':
      return 'plan_creation';
    case 'draft_creating':
    case 'draft_submitted':
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
      return 'not_started';
  }
};

// Get step order for progress calculation
export const getStepOrder = (): CampaignStep[] => [
  'not_started',
  'meeting',
  'plan_creation', 
  'draft_creation',
  'scheduling',
  'payment'
];

// Get step label
export const getStepLabel = (step: CampaignStep): string => {
  switch (step) {
    case 'not_started': return '未開始';
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
  // Raw status_dashboard value from Google Sheets (unmapped, may be empty)
  statusDashboard?: string;
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
  campaignData?: {
    id_promo?: string;
    contact_email?: string;
    url_channel?: string;
    url_content?: string;
    group?: string;
    followers?: string;
    spend_usd?: string;
    imp_est?: string;
    imp_actual?: string;
    url_plan?: string;
    url_draft?: string;
    url_utm?: string;
    payout_form_link?: string;
    spend_jpy_taxed?: string;
    is_live?: string;
    genre?: string;
    tier?: string;
    platform_tier?: string;
    roi_positive?: string;
    handle?: string;
    dri?: string;
    repurposable?: string;
    group_platform?: string;
    channel_image?: string;
    utm_campaign?: string;
    month_date_live?: string;
    yyyy_mm_ww?: string;
    payout_done?: string;
    group_booking?: string;
    mode_id_campaign?: string;
    gift_sent?: string;
    contract_form_submitted?: string;
    plan_submitted?: string;
    draft_submitted?: string;
    live_video_submitted?: string;
    payout_form_submitted?: string;
    utm_poc?: string;
    utm_platform?: string;
    utm_web_domain?: string;
    utm_time_period?: string;
    utm_url_bitly?: string;
    url_main_form?: string;
    url_payout_form?: string;
    output?: string;
    is_row_added?: string;
    count_id_influencer?: string;
    noted_influencers?: string;
    trial_login_email_dashboard?: string;
    trial_login_password_dashboard?: string;
  };
}

export interface Update {
  id: string;
  campaignId: string;
  influencerId: string;
  influencerName: string;
  type: 'status_change' | 'submission' | 'approval' | 'message';
  message: string;
  timestamp: Date;
  // Additional fields for admin actions
  submissionUrl?: string;
  submissionType?: 'plan' | 'draft' | 'content';
  currentStatus?: string;
  requiresAdminAction?: boolean;
  actionType?: 'approve_plan' | 'revise_plan' | 'approve_draft' | 'revise_draft';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
