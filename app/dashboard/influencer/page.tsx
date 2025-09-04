'use client';

import { useAuth } from '@/contexts/AuthContext';
import CampaignCard from '@/components/CampaignCard';
import StatusSection from '@/components/StatusSection';
import OnboardingSurvey from '@/components/OnboardingSurvey';
import OnboardingSurveyInline from '@/components/OnboardingSurveyInline';
import { TrendingUp, Clock, CheckCircle, Calendar, ExternalLink, Settings, Bug, AlertCircle, ClipboardList, FileText, FileEdit, Video, Megaphone, CreditCard, Hourglass, XCircle, Copy, ClipboardCheck, RefreshCw } from 'lucide-react';
import VisibilityToggle from '@/components/VisibilityToggle';
import { AmountVisibilityProvider } from '@/contexts/AmountVisibilityContext';
import PreviousStepMessage from '@/components/PreviousStepMessage';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CampaignStatus, getStepFromStatus } from '@/types';
import { useDesignSystem } from '@/hooks/useDesignSystem';
import { formatAbbreviatedCurrency } from '@/lib/design-system';

export default function InfluencerDashboard() {
  // Prefer full currency unless it overflows; fallback to abbreviated (K/M)
  const formatCurrencyFull = (amount: number, currency: string = 'JPY') => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency }).format(amount || 0);
  };

  const formatCurrencySmart = (amount: number, maxChars: number = 12, currency: string = 'JPY') => {
    const full = formatCurrencyFull(amount, currency);
    return full.length <= maxChars ? full : formatAbbreviatedCurrency(amount, currency);
  };
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  // Redirect unauthenticated users or non-influencers
  useEffect(() => {
    // Wait for auth loading to complete before redirecting
    if (isAuthLoading) return;
    
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user && user.role !== 'influencer') {
      router.replace('/dashboard');
    }
  }, [user, isAuthLoading, router]);

  const ds = useDesignSystem();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showDebugCard, setShowDebugCard] = useState(false);
  const [paymentCheckboxes, setPaymentCheckboxes] = useState<{[key: string]: {invoice: boolean, form: boolean}}>({});
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [urlInputs, setUrlInputs] = useState<{[key: string]: string}>({});
  const [schedulingCheckboxes, setSchedulingCheckboxes] = useState<{[key: string]: {summary: boolean, comment: boolean}}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [paymentWaiting, setPaymentWaiting] = useState<{[key: string]: boolean}>({});
  const [meetingUpdating, setMeetingUpdating] = useState<{[key: string]: boolean}>({});
  const [urlSubmitting, setUrlSubmitting] = useState<{[key: string]: boolean}>({});
  const [confirmingCompleted, setConfirmingCompleted] = useState<{[key: string]: boolean}>({});
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasUsedPremiumCreds, setHasUsedPremiumCreds] = useState(false);
  const [premiumReminderDismissed, setPremiumReminderDismissed] = useState(false);

  // Manual refresh function
  const refreshData = async () => {
    if (user?.id) {
      setIsRefreshing(true);
      try {
        console.log('🔄 Manual refresh: Fetching campaigns for user:', user.id);
        const response = await fetch(`/api/campaigns?userId=${encodeURIComponent(user.id)}&t=${Date.now()}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const userCampaigns = await response.json();
        console.log('✅ Manual refresh: Fetched campaigns:', userCampaigns.length);
        console.log('📊 Manual refresh: Campaign details:', userCampaigns.map((c: any) => ({ id: c.id, status: c.status, influencerId: c.influencerId })));
        setCampaigns(userCampaigns);
      } catch (error) {
        console.error('❌ Manual refresh: Failed to fetch campaigns:', error);
        setCampaigns([]);
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  // Fetch campaigns from API
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (user?.id) {
        try {
          console.log('🔍 Fetching campaigns for user:', user.id);
          // Add cache-busting parameter to ensure fresh data on reload
          const response = await fetch(`/api/campaigns?userId=${encodeURIComponent(user.id)}&t=${Date.now()}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const userCampaigns = await response.json();
          console.log('✅ Fetched campaigns:', userCampaigns.length);
          console.log('📊 Campaign details:', userCampaigns.map((c: any) => ({ id: c.id, status: c.status, influencerId: c.influencerId })));
          setCampaigns(userCampaigns);
        } catch (error) {
          console.error('❌ Failed to fetch campaigns:', error);
          setCampaigns([]);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchCampaigns();
  }, [user?.id]);

  const markPremiumCredsUsed = () => {
    try {
      if (!primaryCampaign?.id) return;
      const usedKey = `premiumCredsUsed:${primaryCampaign.id}`;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(usedKey, '1');
      }
      setHasUsedPremiumCreds(true);
    } catch {}
  };
  
  // Show auth loading state to avoid blank screen while resolving session
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: ds.bg.primary }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: ds.border.primary }}></div>
          <p style={{ color: ds.text.secondary }}>サインイン状態を確認中...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'influencer') {
    // Redirect handled above; render nothing to avoid flashing placeholder UI
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: ds.bg.primary }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: ds.border.primary }}></div>
          <p style={{ color: ds.text.secondary }}>キャンペーンデータを読み込み中...</p>
        </div>
      </div>
    );
  }

  const userCampaigns = campaigns; // Already filtered by user in data service
  
  // Sort campaigns by liveDate in descending order (most recent first)
  const sortedUserCampaigns = [...userCampaigns].sort((a, b) => {
    const aDate = a.schedules?.liveDate ? new Date(a.schedules.liveDate).getTime() : 0;
    const bDate = b.schedules?.liveDate ? new Date(b.schedules.liveDate).getTime() : 0;
    return bDate - aDate; // Descending order
  });
  
  const activeCampaigns = sortedUserCampaigns.filter(campaign => 
    !['completed', 'cancelled'].includes(campaign.status)
  );
  const completedCampaigns = sortedUserCampaigns.filter(campaign => 
    campaign.status === 'completed'
  );

  const totalEarnings = sortedUserCampaigns
    .reduce((sum, campaign) => sum + (campaign.contractedPrice || 0), 0);

  // Map action type to icon component for the Action card
  const getActionIconByType = (type: string) => {
    switch (type) {
      case 'onboarding':
        return ClipboardList;
      case 'meeting':
        return Calendar;
      case 'plan':
        return FileText;
      case 'plan_revising':
        return FileEdit;
      case 'content':
        return Video;
      case 'draft_revising':
        return FileEdit;
      case 'publish':
        return Megaphone;
      case 'payment':
        return CreditCard;
      case 'waiting':
        return Hourglass;
      case 'completed':
        return CheckCircle;
      case 'cancelled':
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  // Get action needed for a campaign based on current step
  // Helper function to extract and format feedback messages
  const getLatestFeedbackMessage = (campaign: any): string => {
    try {
      const messageDashboard = campaign.campaignData?.message_dashboard;
      if (!messageDashboard || typeof messageDashboard !== 'string') {
        return '';
      }

      const messages = JSON.parse(messageDashboard);
      if (!Array.isArray(messages) || messages.length === 0) {
        return '';
      }

      // Find the latest revision feedback message
      const revisionFeedback = messages
        .filter(msg => msg.type === 'revision_feedback')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        [0];

      if (revisionFeedback && revisionFeedback.content) {
        return `<br/><br/><div style="background-color: rgba(239, 246, 255, 0.5); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 12px; margin-top: 8px;"><strong>📝 修正ポイント:</strong><br/>${revisionFeedback.content.replace(/\n/g, '<br/>')}</div>`;
      }

      return '';
    } catch (error) {
      console.log('⚠️ Failed to parse feedback message:', error);
      return '';
    }
  };

  const getActionNeeded = (campaign: any) => {
    const currentStep = getStepFromStatus(campaign.status as CampaignStatus);
    
    switch (currentStep) {
      case 'not_started':
        return {
          title: '基本情報の入力',
          description: 'プロモーション開始前に、基本情報を入力してください。契約書の作成とスケジュール調整に使用されます。',
          icon: AlertCircle,
          color: 'blue',
          action: 'onboarding',
          inputType: 'survey'
        };

      case 'meeting':
        // Show different actions based on meeting status
        if (!campaign.meetingStatus || campaign.meetingStatus === 'not_scheduled') {
          return {
            title: '打ち合わせの予約',
            description: '<a href="https://calendly.com/speak-naoki/30min-1" target="_blank" style="color: #60a5fa; text-decoration: underline;">こちらから</a>打ち合わせを予約し「予約完了」ボタンをクリックしてください',
            icon: Calendar,
            color: 'blue',
            action: 'meeting_schedule',
            inputType: 'meeting_schedule'
          };
        } else if (campaign.meetingStatus === 'scheduled') {
          return {
            title: '打ち合わせへの参加',
            description: '予約済みの打ち合わせに参加し、完了後に「打ち合わせ完了」ボタンをクリックしてください',
            icon: Calendar,
            color: 'blue',
            action: 'meeting_complete',
            inputType: 'meeting_complete'
          };
        } else if (campaign.meetingStatus === 'completed') {
          // Show plan creation action instead (include deadline when available)
          const planDue = formatMonthDay(campaign?.schedules?.planSubmissionDate);
          return {
            title: '構成案の作成',
            description: `プロモーションの構成案を作成しリンクを共有してください${planDue ? `。${planDue}までに構成案の提出をお願いします。` : ''}`,
            icon: AlertCircle,
            color: 'blue',
            action: 'plan',
            inputType: 'url'
          };
        }
        break;

      case 'plan_creation':
        // Show different actions based on current status within the step
        if (campaign.status === 'plan_creating') {
          const planDue = formatMonthDay(campaign?.schedules?.planSubmissionDate);
          return {
            title: '構成案の作成',
            description: `プロモーションの構成案を作成しリンクを共有してください${planDue ? `。${planDue}までに構成案の提出をお願いします。` : ''}`,
            icon: AlertCircle,
            color: 'blue',
            action: 'plan',
            inputType: 'url'
          };
        } else if (campaign.status === 'plan_submitted') {
          return {
            title: '構成案の確認待ち',
            description: '提出した構成案の確認をお待ちください',
            icon: Clock,
            color: 'orange',
            action: 'waiting',
            inputType: 'none'
          };
        } else if (campaign.status === 'plan_revising') {
          const feedbackMessage = getLatestFeedbackMessage(campaign);
          return {
            title: '構成案の修正',
            description: 'フィードバックに基づいて構成案を修正し、再提出してください' + feedbackMessage,
            icon: AlertCircle,
            color: 'blue',
            action: 'plan_revising',
            inputType: 'url'
          };
        }
        break;

      case 'draft_creation':
        // Show different actions based on current status within the step
        if (campaign.status === 'draft_creating') {
          return {
            title: '初稿の作成',
            description: '構成案に基づいてコンテンツを制作し、完成した動画のURLを共有してください',
            icon: AlertCircle,
            color: 'blue',
            action: 'content',
            inputType: 'url'
          };
        } else if (campaign.status === 'draft_submitted') {
          return {
            title: '初稿の確認待ち',
            description: '提出した初稿の確認をお待ちください',
            icon: Clock,
            color: 'purple',
            action: 'waiting',
            inputType: 'none'
          };
        } else if (campaign.status === 'draft_revising') {
          const feedbackMessage = getLatestFeedbackMessage(campaign);
          return {
            title: '初稿の修正',
            description: 'フィードバックに基づいて初稿を修正し、再提出してください' + feedbackMessage,
            icon: AlertCircle,
            color: 'blue',
            action: 'draft_revising',
            inputType: 'url'
          };
        }
        break;

      case 'scheduling':
        if (campaign.status === 'scheduling') {
          return {
            title: 'コンテンツのスケジュール',
            description: '承認されたコンテンツをスケジュールしてください',
            icon: AlertCircle,
            color: 'blue',
            action: 'publish',
            inputType: 'url'
          };
        } else if (campaign.status === 'scheduled') {
          return {
            title: '投稿完了',
            description: 'コンテンツの投稿が完了しました。次に送金手続きを進めてください。',
            icon: CreditCard,
            color: 'blue',
            action: 'payment',
            inputType: 'payment'
          };
        }
        break;

      case 'payment':
        if (campaign.status === 'payment_processing') {
          return {
            title: '送金手続き中です',
            description: 'ご提出いただいた内容を確認し送金手続きに移行します。着金が確認でき次第以下のボタンよりお知らせください。',
            icon: CreditCard,
            color: 'orange',
            action: 'confirm_payment',
            inputType: 'confirm_payment'
          };
        } else if (campaign.status === 'completed') {
          return {
            title: 'アクション不要：PR完了',
            description: 'プロモーションが完了しました。ありがとうございました！',
            icon: CheckCircle,
            color: 'green',
            action: 'completed',
            inputType: 'none'
          };
        }
        break;

      case 'cancelled':
        return {
          title: 'キャンペーンキャンセル',
          description: 'このキャンペーンはキャンセルされました。',
          icon: AlertCircle,
          color: 'red',
          action: 'cancelled',
          inputType: 'none'
        };

      default:
        return null;
    }
    
    // Default return if no action is found
    return null;
  };

  // Calculate pending actions based on whether getActionNeeded returns an action
  const pendingActions = activeCampaigns.filter(campaign => {
    const action = getActionNeeded(campaign);
    return action !== null && action.action !== 'waiting' && action.action !== 'completed';
  }).length;

  // Calculate progress percentage based on completed steps
  const calculateProgress = (campaign: any) => {
    const stepOrder = ['contract', 'meeting', 'plan_creation', 'draft_creation', 'scheduling', 'payment'];
    const currentStep = getStepFromStatus(campaign.status as CampaignStatus);
    const currentIndex = stepOrder.indexOf(currentStep);
    
    // If campaign is completed, return 100%
    if (campaign.status === 'completed') {
      return 100;
    }
    
    // Count completed steps based on actual completion status
    let completedSteps = 0;
    
    // Check if meeting step is completed
    if (currentStep !== 'meeting' || ['plan_creating', 'plan_submitted', 'plan_revising', 'draft_creating', 'draft_submitted', 'draft_revising', 'scheduling', 'scheduled', 'payment_processing', 'completed'].includes(campaign.status)) {
      completedSteps++;
    }
    
    // Check if plan_creation step is completed
    if (currentStep !== 'plan_creation' || ['draft_creating', 'draft_submitted', 'draft_revising', 'scheduling', 'scheduled', 'payment_processing', 'completed'].includes(campaign.status)) {
      completedSteps++;
    }
    
    // Check if draft_creation step is completed
    if (currentStep !== 'draft_creation' || ['scheduling', 'scheduled', 'payment_processing', 'completed'].includes(campaign.status)) {
      completedSteps++;
    }
    
    // Check if scheduling step is completed
    if (currentStep !== 'scheduling' || ['payment_processing', 'completed'].includes(campaign.status)) {
      completedSteps++;
    }
    
    const totalSteps = stepOrder.length;
    
    // Return percentage of completed steps
    return Math.round((completedSteps / totalSteps) * 100);
  };

  // Calculate days left until live date
  const getDaysUntilLive = (campaign: any) => {
    if (!campaign.schedules?.liveDate) return null;
    
    const liveDate = new Date(campaign.schedules.liveDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    liveDate.setHours(0, 0, 0, 0);
    
    const diffTime = liveDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Calculate days left until a specific date
  const getDaysUntil = (date: Date | string | undefined | null) => {
    if (!date) return null;
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dateObj.setHours(0, 0, 0, 0);
    const diffTime = dateObj.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Get next-step label and days remaining based on current status
  const getNextStepInfo = (campaign: any): { label: string; days: number | null } => {
    const status = campaign.status as CampaignStatus;
    // Default to PR投稿 using liveDate
    let label = 'PR投稿';
    let targetDate: string | null | undefined = campaign?.schedules?.liveDate;

    // Do not compute days for completed campaigns
    if (status === 'completed') {
      return { label: 'PR投稿', days: null };
    }

    switch (status) {
      case 'not_started':
      case 'meeting_scheduling':
      case 'meeting_scheduled':
      case 'contract_pending':
      case 'plan_creating':
      case 'plan_revising':
        label = status === 'contract_pending' ? 'オンライン契約' : '構成案提出';
        targetDate = campaign?.schedules?.planSubmissionDate;
        break;
      case 'plan_submitted':
      case 'draft_creating':
      case 'draft_revising':
        label = '初稿提出';
        targetDate = campaign?.schedules?.draftSubmissionDate;
        break;
      case 'draft_submitted':
      case 'scheduling':
      case 'scheduled':
      case 'payment_processing':
        label = 'PR投稿';
        targetDate = campaign?.schedules?.liveDate;
        break;
      case 'cancelled':
        // Keep default; there is effectively no next step but we show PR as N/A
        label = 'PR投稿';
        targetDate = campaign?.schedules?.liveDate;
        break;
      default:
        label = 'PR投稿';
        targetDate = campaign?.schedules?.liveDate;
    }

    return { label, days: getDaysUntil(targetDate) };
  };

  // Format date helper for schedule display
  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return '未定';
    if (typeof date === 'string' && date.trim() === '') return '未定';
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return '未定';
      return new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      }).format(dateObj);
    } catch {
      return '未定';
    }
  };

  // Format month/day (MM/DD) for concise deadline display
  const formatMonthDay = (date: Date | string | undefined | null): string | null => {
    if (!date) return null;
    try {
      const d = new Date(date as any);
      if (isNaN(d.getTime())) return null;
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${mm}/${dd}`;
    } catch {
      return null;
    }
  };

  // Ensure URL is absolute to avoid being treated as a relative path by the browser
  const getAbsoluteUrl = (url: string | undefined | null) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed.replace(/^\/+/, '')}`;
  };

  // Dynamic guideline link based on platform
  const getGuidelineUrl = (platform: string | undefined) => {
    if (!platform) return '';
    if (platform === 'youtube_long' || platform === 'yt') {
      return 'https://usespeak.notion.site/YouTube-4-0-5b88f1ad34ed45f3aaeca324af039665?source=copy_link';
    }
    if (platform === 'podcast' || platform === 'pc') {
      return 'https://usespeak.notion.site/Podcast-224792ec2f1080f2a7d5fce804ce4b93?source=copy_link';
    }
    if (
      platform === 'youtube_short' ||
      platform === 'short_video' ||
      platform === 'instagram_reel' ||
      platform === 'tiktok'
    ) {
      return 'https://usespeak.notion.site/1b3792ec2f10800f9f94e476a87c06f1?source=copy_link';
    }
    return '';
  };

  // Get the most active campaign for status display
  const primaryCampaign = activeCampaigns[0] || userCampaigns[0];

  // Initialize premium reminder state after primaryCampaign is known
  useEffect(() => {
    try {
      if (!primaryCampaign?.id) return;
      const usedKey = `premiumCredsUsed:${primaryCampaign.id}`;
      const dismissedKey = `premiumReminderDismissed:${primaryCampaign.id}`;
      const used = typeof window !== 'undefined' ? window.localStorage.getItem(usedKey) : null;
      const dismissed = typeof window !== 'undefined' ? window.localStorage.getItem(dismissedKey) : null;
      setHasUsedPremiumCreds(!!used);
      setPremiumReminderDismissed(!!dismissed);
    } catch {}
  }, [primaryCampaign?.id]);

  // Get days left for the primary campaign
  const daysUntilLive = primaryCampaign ? getDaysUntilLive(primaryCampaign) : null;

  // Get next step info (label and days) for the primary campaign
  const nextStepInfo = primaryCampaign ? getNextStepInfo(primaryCampaign) : null;

  // Check if current step is behind schedule (for warning message)
  const isCurrentStepBehindSchedule = (campaign: any) => {
    if (!campaign || campaign.status === 'completed') return false;
    const nextStepInfo = getNextStepInfo(campaign);
    return nextStepInfo && nextStepInfo.days !== null && nextStepInfo.days < 0;
  };

  // Check if current step is due today
  const isCurrentStepDueToday = (campaign: any) => {
    if (!campaign) return false;
    const nextStepInfo = getNextStepInfo(campaign);
    return nextStepInfo && nextStepInfo.days === 0;
  };

  // Determine if action is required now by influencer
  const isActionRequiredNow = (campaign: any) => {
    const action = getActionNeeded(campaign);
    return !!(action && action.action !== 'waiting' && action.action !== 'completed');
  };

  // Total payout across all campaigns (used when there are no active campaigns)
  const totalPayoutAllCampaigns = (sortedUserCampaigns || []).reduce((sum: number, c: any) => {
    const price = typeof c?.contractedPrice === 'number' ? c.contractedPrice : 0;
    return sum + price;
  }, 0);

  // Check if action is overdue (more than 1 day past due)
  const isActionOverdue = (campaign: any) => {
    if (!campaign.schedules?.liveDate) return false;
    // Never show overdue for completed campaigns
    if (campaign.status === 'completed') return false;
    
    const daysLeft = getDaysUntilLive(campaign);
    return daysLeft !== null && daysLeft < -1; // More than 1 day overdue
  };

  // Get overdue error message
  const getOverdueErrorMessage = (campaign: any) => {
    if (!isActionOverdue(campaign)) return null;
    
    const daysOverdue = Math.abs(getDaysUntilLive(campaign) || 0);
    return `⚠️ 期限を${daysOverdue}日超過しています。早急に対応してください。`;
  };

  // Handle meeting completion checkbox
  const handleMeetingCompleted = (campaignId: string) => {
    setCampaigns(prevCampaigns => 
      prevCampaigns.map(campaign => 
        campaign.id === campaignId 
          ? { ...campaign, meetingCompleted: !campaign.meetingCompleted }
          : campaign
      )
    );
  };

  const handleMeetingStatusChange = async (campaignId: string, status: 'not_scheduled' | 'scheduled' | 'completed') => {
    // No confirmation needed for button-based actions as they are explicit
    try {
        setMeetingUpdating(prev => ({ ...prev, [campaignId]: true }));
        let newStatus: string;
        
        if (status === 'completed') {
          newStatus = 'plan_creating'; // After meeting completed, go to plan creation (contract is first step now)
        } else if (status === 'scheduled') {
          newStatus = 'meeting_scheduled';
        } else {
          newStatus = 'meeting_scheduling';
        }

        // Update Google Sheets via API
        const response = await fetch('/api/campaigns/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            campaignId,
            influencerId: user?.id,
            newStatus
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          console.log('✅ Meeting status updated successfully in Google Sheets');
          
          // Update local state
          setCampaigns(prevCampaigns => 
            prevCampaigns.map(campaign => 
              campaign.id === campaignId 
                ? { ...campaign, meetingStatus: status, status: newStatus as CampaignStatus }
                : campaign
            )
          );
        } else {
          console.error('❌ Failed to update meeting status:', result.error);
          
          // Show specific error message for authentication issues
          if (result.error?.includes('Service Account') || result.error?.includes('write access not configured')) {
            alert('Google Sheetsの書き込み権限が設定されていません。管理者にお問い合わせください。');
          } else {
            alert('更新に失敗しました。もう一度お試しください。');
          }
        }
      } catch (error) {
        console.error('❌ Error updating meeting status:', error);
        alert('更新に失敗しました。もう一度お試しください。');
      }
      finally {
        setMeetingUpdating(prev => ({ ...prev, [campaignId]: false }));
      }
  };

  const handleSchedulingCheckbox = (campaignId: string, type: 'summary' | 'comment', checked: boolean) => {
    setSchedulingCheckboxes(prev => ({
      ...prev,
      [campaignId]: {
        ...prev[campaignId],
        [type]: checked
      }
    }));
  };

  const handlePaymentSubmission = async (campaignId: string) => {
    if (!window.confirm('送金手続きを開始しますか？')) return;
    const campaignCheckboxes = paymentCheckboxes[campaignId] || { invoice: false, form: false };
    
    if (!campaignCheckboxes.invoice || !campaignCheckboxes.form) {
      alert('チェックボックスを全てチェックしてください');
      return;
    }

    // Proceed with payment processing
    setIsProcessingPayment(true);
    
    try {
      // Update Google Sheets via API
      const response = await fetch('/api/campaigns/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId,
          influencerId: user?.id,
          newStatus: 'payment_processing'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Payment status updated successfully in Google Sheets');
        
        // Update local state
        setCampaigns(prevCampaigns => 
          prevCampaigns.map(campaign => 
            campaign.id === campaignId 
              ? { ...campaign, status: 'payment_processing' }
              : campaign
          )
        );

        // Show waiting state immediately after CTA
        setPaymentWaiting(prev => ({ ...prev, [campaignId]: true }));
      } else {
        console.error('❌ Failed to update payment status:', result.error);
        
        // Show specific error message for authentication issues
        if (result.error?.includes('Service Account') || result.error?.includes('write access not configured')) {
          alert('Google Sheetsの書き込み権限が設定されていません。管理者にお問い合わせください。');
        } else {
          alert('更新に失敗しました。もう一度お試しください。');
        }
      }
    } catch (error) {
      console.error('❌ Error updating payment status:', error);
      alert('更新に失敗しました。もう一度お試しください。');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentCheckbox = (campaignId: string, type: 'invoice' | 'form', checked: boolean) => {
    setPaymentCheckboxes(prev => {
      const updated = {
        ...prev,
        [campaignId]: {
          ...prev[campaignId],
          [type]: checked
        }
      };

      return updated;
    });
  };

  // Confirm payment completion CTA (着金を確認しました)
  const handleConfirmPaymentCompleted = async (campaignId: string) => {
    const ok = window.confirm('着金を確認しましたか？');
    if (!ok) return;
    setConfirmingCompleted(prev => ({ ...prev, [campaignId]: true }));
    try {
      await handleStatusChange(campaignId, 'completed');
    } finally {
      setConfirmingCompleted(prev => ({ ...prev, [campaignId]: false }));
    }
  };

  // Function to advance to next step when current step is completed
  const advanceToNextStep = async (campaignId: string, currentStatus: string) => {
    const currentStep = getStepFromStatus(currentStatus as CampaignStatus);
    const stepOrder = ['contract', 'meeting', 'plan_creation', 'draft_creation', 'scheduling', 'payment'];
    const currentStepIndex = stepOrder.indexOf(currentStep);
    
    if (currentStepIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentStepIndex + 1];
      
      // Map next step to appropriate status
      let nextStatus: CampaignStatus;
      switch (nextStep) {
        case 'plan_creation':
          nextStatus = 'plan_creating';
          break;
        case 'contract':
          nextStatus = 'contract_pending';
          break;
        case 'draft_creation':
          nextStatus = 'draft_creating';
          break;
        case 'scheduling':
          nextStatus = 'scheduling';
          break;
        case 'payment':
          nextStatus = 'payment_processing';
          break;
        default:
          return; // No next step
      }
      
      try {
        // Update Google Sheets via API
        const response = await fetch('/api/campaigns/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            campaignId,
            influencerId: user?.id,
            newStatus: nextStatus
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          console.log('✅ Campaign advanced to next step successfully in Google Sheets');
          
          // Update local state
          setCampaigns(prevCampaigns => 
            prevCampaigns.map(campaign => 
              campaign.id === campaignId 
                ? { ...campaign, status: nextStatus }
                : campaign
            )
          );
        } else {
          console.error('❌ Failed to advance campaign:', result.error);
        }
      } catch (error) {
        console.error('❌ Error advancing campaign:', error);
      }
    }
  };

  const handleUrlSubmission = async (campaignId: string, currentStatus: string) => {
    const url = urlInputs[campaignId] || '';
    
    if (!url.trim()) {
      alert('URLを入力してください');
      return;
    }

    // For content scheduling, check if required checkboxes are ticked
    if (currentStatus === 'scheduling') {
      const campaignCheckboxes = schedulingCheckboxes[campaignId] || { summary: false, comment: false };
      
      if (!campaignCheckboxes.summary || !campaignCheckboxes.comment) {
        alert('チェックボックスを全てチェックしてください');
        return;
      }
    }

    // Define step-based status transitions
    const stepTransitions: {[key: string]: {nextStatus: string, confirmMessage: string, urlType: 'plan' | 'draft' | 'content'}} = {
      // Plan creation step transitions
      'plan_creating': {
        nextStatus: 'plan_submitted',
        confirmMessage: '構成案を提出しますか？',
        urlType: 'plan'
      },
      'plan_revising': {
        nextStatus: 'plan_submitted',
        confirmMessage: '修正版構成案を提出しますか？',
        urlType: 'plan'
      },
      // Draft creation step transitions
      'draft_creating': {
        nextStatus: 'draft_submitted',
        confirmMessage: '初稿を提出しますか？',
        urlType: 'draft'
      },
      'draft_revising': {
        nextStatus: 'draft_submitted',
        confirmMessage: '修正版初稿を提出しますか？',
        urlType: 'draft'
      },
      // Scheduling step transitions
      'scheduling': {
        nextStatus: 'scheduled',
        confirmMessage: 'コンテンツをスケジュールしましたか？',
        urlType: 'content'
      }
    };

    const transition = stepTransitions[currentStatus];
    if (!transition) return;

    if (window.confirm(transition.confirmMessage)) {
      try {
        setUrlSubmitting(prev => ({ ...prev, [campaignId]: true }));
        // Update Google Sheets via API
        const response = await fetch('/api/campaigns/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            campaignId,
            influencerId: user?.id,
            newStatus: transition.nextStatus,
            submittedUrl: url,
            urlType: transition.urlType
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          console.log('✅ Campaign updated successfully in Google Sheets');
          
          // Update local state
          // Persist status as 'scheduled' and do NOT auto-advance to payment here
          setCampaigns(prevCampaigns => 
            prevCampaigns.map(campaign => 
              campaign.id === campaignId 
                ? { ...campaign, status: transition.nextStatus as CampaignStatus }
                : campaign
            )
          );
          
          // Clear the URL input
          setUrlInputs(prev => ({ ...prev, [campaignId]: '' }));
          
          // Do not auto-advance; we remain at scheduled until payment step is triggered
        } else {
          console.error('❌ Failed to update campaign:', result.error);
          
          // Show specific error message for authentication issues
          if (result.error?.includes('Service Account') || result.error?.includes('write access not configured')) {
            alert('Google Sheetsの書き込み権限が設定されていません。管理者にお問い合わせください。');
          } else {
            alert('更新に失敗しました。もう一度お試しください。');
          }
        }
      } catch (error) {
        console.error('❌ Error updating campaign:', error);
        alert('更新に失敗しました。もう一度お試しください。');
      } finally {
        setUrlSubmitting(prev => ({ ...prev, [campaignId]: false }));
      }
    }
  };

  // Handle status change for debug
  const handleStatusChange = async (campaignId: string, newStatus: CampaignStatus) => {
    try {
      // Update Google Sheets via API
      const response = await fetch('/api/campaigns/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId,
          influencerId: user?.id,
          newStatus
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Debug status change updated successfully in Google Sheets');
        
        // Update local state
        setCampaigns(prevCampaigns => 
          prevCampaigns.map(campaign => 
            campaign.id === campaignId 
              ? { ...campaign, status: newStatus }
              : campaign
          )
        );
              } else {
          console.error('❌ Failed to update debug status:', result.error);
          
          // Show specific error message for authentication issues
          if (result.error?.includes('Service Account') || result.error?.includes('write access not configured')) {
            alert('Google Sheetsの書き込み権限が設定されていません。管理者にお問い合わせください。');
          } else {
            alert('更新に失敗しました。もう一度お試しください。');
          }
        }
    } catch (error) {
      console.error('❌ Error updating debug status:', error);
      alert('更新に失敗しました。もう一度お試しください。');
    }
  };

  // Get status options for debug dropdown
  const getStatusOptions = (): { value: CampaignStatus; label: string }[] => [
    { value: 'meeting_scheduling', label: '打ち合わせ予約中' },
    { value: 'meeting_scheduled', label: '打ち合わせ予約済み' },
    { value: 'plan_creating', label: '構成案作成中' },
    { value: 'plan_submitted', label: '構成案提出済み' },
    
    { value: 'plan_revising', label: '構成案修正中' },
    { value: 'draft_creating', label: '初稿作成中' },
    { value: 'draft_submitted', label: '初稿提出済み' },
    { value: 'draft_revising', label: '初稿修正中' },
    { value: 'scheduling', label: '投稿準備中' },
    { value: 'scheduled', label: '投稿済み' },
    { value: 'payment_processing', label: '送金手続き中' },
    { value: 'completed', label: 'PR完了' },
    { value: 'cancelled', label: 'PRキャンセル' }
  ];



  return (
    <AmountVisibilityProvider>
      <div className="min-h-screen" style={{ backgroundColor: ds.bg.primary }}>
      <div className="max-w-7xl mx-auto mobile-padding">
        <div className="mb-6 sm:mb-8">
          {/* Responsive Header Layout */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-2">
            {/* Greeting Section with Refresh Button */}
            <div className="flex-1 min-w-0 flex items-center gap-3">
              <h1 className="font-bold truncate text-2xl sm:text-3xl lg:text-4xl" style={{ 
                color: ds.text.primary,
                lineHeight: 1.2,
                fontWeight: ds.typography.heading.h1.fontWeight
              }}>
                {user.name}さんのスピークPR情報
              </h1>
              
              {/* Refresh Button */}
              <button
                onClick={refreshData}
                disabled={isRefreshing}
                className="flex items-center justify-center p-1 transition-colors disabled:opacity-50 flex-shrink-0"
                style={{ 
                  color: ds.text.secondary
                }}
                onMouseEnter={(e) => !isRefreshing && (e.currentTarget.style.color = ds.text.primary)}
                onMouseLeave={(e) => !isRefreshing && (e.currentTarget.style.color = ds.text.secondary)}
              >
                <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {/* Debug Buttons Section - Only for demo accounts */}
            {(user.id === 'actre_vlog_yt' || user.id === 'eigatube_yt') && (
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <button
                  onClick={() => setShowDebugCard(!showDebugCard)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                  style={{ 
                    backgroundColor: ds.button.secondary.bg,
                    color: ds.button.secondary.text
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.hover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.bg}
                >
                  <Bug size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">デバッグ</span>
                  <span className="sm:hidden">デバッグ</span>
                </button>
              </div>
            )}
          </div>
          {!primaryCampaign && (
            <p className="mobile-text" style={{ color: ds.text.secondary }}>
              進捗状況をご確認ください
            </p>
          )}
        </div>

        {/* Debug Card - Only for demo accounts */}
        {showDebugCard && (user.id === 'actre_vlog_yt' || user.id === 'eigatube_yt') && (
          <div className="mb-6 sm:mb-8">
            <div className="rounded-xl p-4 sm:p-6 border-2" style={{ 
              borderColor: ds.border.primary,
              backgroundColor: ds.bg.card
            }}>
              <div className="flex items-center space-x-2 mb-4">
                <Settings size={20} style={{ color: ds.text.accent }} />
                <h2 className="text-lg font-semibold" style={{ color: ds.text.primary }}>デバッグモード</h2>
              </div>
              <p className="text-sm mb-4" style={{ color: ds.text.secondary }}>
                デモ用アカウントでのみ表示されます。キャンペーンのステータスを変更してテストできます。
              </p>
              
              {activeCampaigns.length > 0 ? (
                <div className="space-y-3">
                  {activeCampaigns.map(campaign => (
                    <div key={campaign.id} className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: ds.bg.surface }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: ds.text.primary }}>
                          {campaign.title}
                        </p>
                        <p className="text-xs" style={{ color: ds.text.secondary }}>
                          現在: {campaign.status}
                        </p>
                      </div>
                      <select
                        value={campaign.status}
                        onChange={(e) => handleStatusChange(campaign.id, e.target.value as CampaignStatus)}
                        className="text-sm rounded px-2 py-1 focus:outline-none focus:ring-2"
                        style={{ 
                          backgroundColor: ds.form.input.bg,
                          borderColor: ds.form.input.border,
                          color: ds.text.primary
                        }}
                      >
                        {getStatusOptions().map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: ds.text.secondary }}>
                  アクティブなキャンペーンがありません
                </p>
              )}
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="mobile-grid mb-6 sm:mb-8">
          <div className="rounded-xl p-4 sm:p-6" style={{ 
            backgroundColor: ds.bg.card,
            borderColor: ds.border.primary,
            borderWidth: '1px',
            borderStyle: 'solid'
          }}>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: ds.button.primary.bg + '20' }}>
                <CreditCard size={20} style={{ color: ds.button.primary.bg }} />
              </div>
              <div className="min-w-0">
                <VisibilityToggle>
                  <p className="text-xl sm:text-2xl font-bold" style={{ color: ds.text.primary }}>
                    {activeCampaigns.length > 0
                      ? (() => {
                          const subtotal = activeCampaigns.reduce((sum: number, c: any) => sum + (c.contractedPrice || 0), 0);
                          const taxed = Math.round(subtotal * 1.1);
                          return formatCurrencySmart(taxed);
                        })()
                      : formatCurrencySmart(totalPayoutAllCampaigns)}
                  </p>
                </VisibilityToggle>
                <p className="text-xs sm:text-sm" style={{ color: ds.text.secondary }}>
                  {activeCampaigns.length > 0 ? '進行中PRの報酬額（税込）' : 'PR報酬総額'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4 sm:p-6" style={{ 
            backgroundColor: ds.bg.card,
            borderColor: ds.border.primary,
            borderWidth: '1px',
            borderStyle: 'solid'
          }}>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: '#f97316' + '20' }}>
                <Clock size={20} style={{ color: '#f97316' }} />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold" style={{ color: ds.text.primary }}>
                  {pendingActions}
                </p>
                <p className="text-xs sm:text-sm" style={{ color: ds.text.secondary }}>要対応</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4 sm:p-6" style={{ 
            backgroundColor: ds.bg.card,
            borderColor: ds.border.primary,
            borderWidth: '1px',
            borderStyle: 'solid'
          }}>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg flex-shrink-0" style={{ 
                backgroundColor: nextStepInfo && nextStepInfo.days !== null && nextStepInfo.days < 0 
                  ? '#ef4444' + '20' 
                  : nextStepInfo && nextStepInfo.days === 0
                  ? '#eab308' + '20'
                  : '#22c55e' + '20' 
              }}>
                {nextStepInfo && nextStepInfo.days !== null && nextStepInfo.days < 0 ? (
                  <AlertCircle size={20} style={{ color: '#ef4444' }} />
                ) : nextStepInfo && nextStepInfo.days === 0 ? (
                  <Clock size={20} style={{ color: '#eab308' }} />
                ) : (
                  <CheckCircle size={20} style={{ color: '#22c55e' }} />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold" style={{ color: ds.text.primary }}>
                  {nextStepInfo && nextStepInfo.days !== null ? (
                    nextStepInfo.days > 0 ? `${nextStepInfo.days}日` :
                    nextStepInfo.days === 0 ? '今日' :
                    `${Math.abs(nextStepInfo.days)}日遅れ`
                  ) : '未確定'}
                </p>
                <p className="text-xs sm:text-sm" style={{ color: ds.text.secondary }}>{nextStepInfo ? `${nextStepInfo.label}までの日数` : '次のステップまでの日数'}</p>
              </div>
            </div>
          </div>
      </div>

        {/* Action Section */}
        {primaryCampaign && (
          <div className="mb-6 sm:mb-8">
            
            {/* Warning Message for Behind Schedule */}
            {isActionRequiredNow(primaryCampaign) && isCurrentStepBehindSchedule(primaryCampaign) ? (
              <div className="mb-4 p-3 border rounded-lg" style={{ 
                backgroundColor: ds.isDark ? '#2d1b1b' : '#fef2f2', // Dark mode: dark red, Light mode: light red
                borderColor: ds.isDark ? '#7f1d1d' : '#fecaca', // Dark mode: darker red, Light mode: red border
                borderWidth: '1px',
                borderStyle: 'solid'
              }}>
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} style={{ color: '#ef4444' }} />
                  <span className="text-sm font-medium" style={{ 
                    color: ds.isDark ? '#f87171' : '#dc2626' // Dark mode: lighter red, Light mode: dark red
                  }}>
                    スケジュールより遅れています
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ 
                  color: ds.isDark ? '#dc2626' : '#7f1d1d' // Dark mode: medium red, Light mode: darker red
                }}>
                  次のステップの期限を過ぎています。可能な限り早めの対応をお願いいたします。
                </p>
              </div>
            ) : isActionRequiredNow(primaryCampaign) && isCurrentStepDueToday(primaryCampaign) ? (
              <div className="mb-4 p-3 border rounded-lg" style={{ 
                backgroundColor: ds.isDark ? '#2d2a1b' : '#fefce8', // Dark mode: dark yellow, Light mode: light yellow
                borderColor: ds.isDark ? '#a16207' : '#fde68a', // Dark mode: darker yellow, Light mode: yellow border
                borderWidth: '1px',
                borderStyle: 'solid'
              }}>
                <div className="flex items-center gap-2">
                  <Clock size={16} style={{ color: '#eab308' }} />
                  <span className="text-sm font-medium" style={{ 
                    color: ds.isDark ? '#fbbf24' : '#a16207' // Dark mode: lighter yellow, Light mode: dark yellow
                  }}>
                    本日が期限です
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ 
                  color: ds.isDark ? '#a16207' : '#713f12' // Dark mode: medium yellow, Light mode: darker yellow
                }}>
                  次のステップの期限が本日となっております。お時間のあるときにご対応をお願いいたします。
                </p>
              </div>
            ) : (
              /* Status Message - only show if not behind schedule or due today */
              <p className="mb-4" style={{ color: ds.text.primary, fontSize: ds.typography.text.base.fontSize, lineHeight: ds.typography.text.base.lineHeight, fontWeight: 600 }}>
                {(() => {
                  const planDueForMsg = formatMonthDay(primaryCampaign?.schedules?.planSubmissionDate);
                  const messages: Record<string, string> = {
                    not_started: '🎉 Welcome! まずは基本情報のご入力をお願いします。',
                    meeting_scheduling: '✅ 基本情報のご入力ありがとうございます！打ち合わせのご予約にお進みください。',
                    meeting_scheduled: '📅 打ち合わせのご予約ありがとうございます！当日のご参加をお願いします。',
                    plan_creating: `🤝 打ち合わせありがとうございました！構成案の作成をお願いします。${planDueForMsg ? `${planDueForMsg}までに構成案の提出をお願いします。` : ''}`,
                    plan_submitted: '📋 構成案のご提出ありがとうございます！ただいま確認中です。',
                    plan_revising: '✏️ ご提出ありがとうございます！フィードバックに沿って修正をお願いします。',
                    draft_creating: '🎊 素敵な構成案をありがとうございます！構成案に沿い、初稿作成にお進みください。',
                    draft_submitted: '🎬 初稿のご提出ありがとうございます！ただいま確認中です。',
                    draft_revising: '🔧 初稿修正のご対応をお願いします。',
                    scheduling: '📱 初稿のご対応ありがとうございます！投稿準備をお願いします。',
                    scheduled: '🚀 投稿ありがとうございます！送金手続きを進めます。',
                    payment_processing: '💰 投稿ありがとうございました！送金手続きを開始しました。着金まで少々お待ちください。',
                    completed: '🎉 ご協力ありがとうございました！プロモーションは完了しました。',
                    cancelled: '😔 今回はご対応ありがとうございました。',
                  };
                  return messages[primaryCampaign.status] || '進捗ありがとうございます！次のステップにお進みください。';
                })()}
              </p>
            )}
            
            <div className="rounded-xl p-4 sm:p-6" style={{ 
              backgroundColor: ds.bg.card,
              borderColor: ds.border.primary,
              borderWidth: '1px',
              borderStyle: 'solid'
            }}>
              <h3 className="font-semibold mb-4" style={{ color: ds.text.primary, fontSize: ds.typography.heading.h2.fontSize, lineHeight: ds.typography.heading.h2.lineHeight }}>
                次のステップ
              </h3>
              {(() => {
                const action = getActionNeeded(primaryCampaign);
                
                if (!action) {
                  // Special case for draft_submitted status
                  if (primaryCampaign.status === 'draft_submitted') {
                    return (
                      <div className="flex items-start space-x-4">
                        <div className="p-3 rounded-lg flex-shrink-0" style={{ 
                          backgroundColor: ds.status.completed.bg,
                          color: ds.status.completed.text,
                          borderColor: ds.status.completed.border
                        }}>
                          <CheckCircle size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2" style={{ color: ds.text.primary }}>
                            アクション不要：初稿確認中
                          </h3>
                          <p style={{ color: ds.text.secondary }}>
                            初稿の確認を行っています。フィードバックをお待ちください。
                          </p>
                        </div>
                      </div>
                    );
                  }
                  
                  
                  
                  return (
                    <div className="flex items-start space-x-4">
                      <div className="p-3 rounded-lg flex-shrink-0" style={{ 
                        backgroundColor: ds.status.completed.bg,
                        color: ds.status.completed.text,
                        borderColor: ds.status.completed.border
                      }}>
                        <CheckCircle size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2" style={{ color: ds.text.primary }}>
                          アクション不要
                        </h3>
                        <p style={{ color: ds.text.secondary }}>
                          現在、アクションは必要ありません。次のステップをお待ちください。
                        </p>
                      </div>
                    </div>
                  );
                }
                
                // If payment waiting, show a dedicated waiting card
                if (paymentWaiting[primaryCampaign.id]) {
                  return (
                    <div className="flex items-start space-x-4">
                      <div className="p-3 rounded-lg flex-shrink-0" style={{ 
                        backgroundColor: '#f97316' + '20',
                        color: '#f97316',
                        borderColor: '#f97316' + '30'
                      }}>
                        <CreditCard size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2" style={{ color: ds.text.primary }}>
                          送金手続き中：着金を確認次第以下のボタンよりお知らせください
                        </h3>
                        <p className="mb-4" style={{ color: ds.text.secondary }}>
                          ご提出いただいた内容を確認し送金手続きに移行します。着金が確認でき次第以下のボタンよりお知らせください。
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleConfirmPaymentCompleted(primaryCampaign.id)}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            style={{ backgroundColor: ds.button.primary.bg, color: ds.button.primary.text }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.button.primary.hover}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ds.button.primary.bg}
                          >
                            {confirmingCompleted[primaryCampaign.id] ? '更新中...' : '着金を確認しました'}
                          </button>
                          <a
                            href={`mailto:naoki@usespeak.com?subject=%E9%80%81%E9%87%91%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6%E5%95%8F%E3%81%84%E5%90%88%E3%82%8F%E3%81%9B&body=%E3%82%AD%E3%83%A3%E3%83%B3%E3%83%9A%E3%83%BC%E3%83%B3ID%3A%20${encodeURIComponent(primaryCampaign.id)}`}
                            className="text-sm"
                            style={{ color: '#60a5fa', textDecoration: 'underline' }}
                          >
                            インフルエンサー送金について
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-lg flex-shrink-0" style={{ 
                      backgroundColor: '#f97316' + '20',
                      color: '#f97316',
                      borderColor: '#f97316' + '30'
                    }}>
                      {(() => { const IconComp = getActionIconByType(action.action); return <IconComp size={24} />; })()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2" style={{ color: ds.text.primary }}>
                        {action.title}
                      </h3>
                      <p 
                        className="mb-4"
                        style={{ color: ds.text.secondary }}
                        dangerouslySetInnerHTML={{ __html: action.description }}
                      />
                      
                      {/* Input Section based on inputType */}
                      {action.inputType === 'meeting_schedule' && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleMeetingStatusChange(primaryCampaign.id, 'scheduled')}
                            disabled={!!meetingUpdating[primaryCampaign.id]}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            style={{ 
                              backgroundColor: ds.button.primary.bg,
                              color: ds.button.primary.text
                            }}
                            onMouseEnter={(e) => !meetingUpdating[primaryCampaign.id] && (e.currentTarget.style.backgroundColor = ds.button.primary.hover)}
                            onMouseLeave={(e) => !meetingUpdating[primaryCampaign.id] && (e.currentTarget.style.backgroundColor = ds.button.primary.bg)}
                          >
                            {meetingUpdating[primaryCampaign.id] ? '更新中...' : '予約完了'}
                          </button>
                        </div>
                      )}

                      {action.inputType === 'meeting_complete' && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleMeetingStatusChange(primaryCampaign.id, 'completed')}
                            disabled={!!meetingUpdating[primaryCampaign.id]}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            style={{ 
                              backgroundColor: ds.button.primary.bg,
                              color: ds.button.primary.text
                            }}
                            onMouseEnter={(e) => !meetingUpdating[primaryCampaign.id] && (e.currentTarget.style.backgroundColor = ds.button.primary.hover)}
                            onMouseLeave={(e) => !meetingUpdating[primaryCampaign.id] && (e.currentTarget.style.backgroundColor = ds.button.primary.bg)}
                          >
                            {meetingUpdating[primaryCampaign.id] ? '更新中...' : '打ち合わせ完了'}
                          </button>
                        </div>
                      )}

                      {action.inputType === 'checkbox' && (
                        <div className="flex items-center justify-end">
                          <label className="flex items-center space-x-3 text-sm cursor-pointer" style={{ color: ds.text.secondary }}>
                            <span>完了</span>
                            <input
                              type="checkbox"
                                                              className="w-6 h-6 text-blue-500 rounded focus:ring-blue-500 focus:ring-2"
                                style={{ 
                                  backgroundColor: ds.form.input.bg,
                                  borderColor: ds.form.input.border
                                }}
                            />
                          </label>
                        </div>
                      )}

                      {action.inputType === 'url' && (
                        <div className="space-y-4">
                          {action.title === 'コンテンツのスケジュール' && (
                            <div className="space-y-3">
                              <label className="flex items-center space-x-3 text-sm cursor-pointer" style={{ color: ds.text.primary }}>
                                <input
                                  type="checkbox"
                                  checked={schedulingCheckboxes[primaryCampaign.id]?.summary || false}
                                  onChange={(e) => handleSchedulingCheckbox(primaryCampaign.id, 'summary', e.target.checked)}
                                  className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500 focus:ring-2"
                                  style={{ 
                                    backgroundColor: ds.form.input.bg,
                                    borderColor: ds.form.input.border
                                  }}
                                />
                                <span>指定の内容を概要欄に追加済み</span>
                              </label>
                              <label className="flex items-center space-x-3 text-sm cursor-pointer" style={{ color: ds.text.primary }}>
                                <input
                                  type="checkbox"
                                  checked={schedulingCheckboxes[primaryCampaign.id]?.comment || false}
                                  onChange={(e) => handleSchedulingCheckbox(primaryCampaign.id, 'comment', e.target.checked)}
                                  className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500 focus:ring-2"
                                  style={{ 
                                    backgroundColor: ds.form.input.bg,
                                    borderColor: ds.form.input.border
                                  }}
                                />
                                <span>指定の内容を固定コメントに追加済み</span>
                              </label>
                            </div>
                          )}
                          <div className="flex items-center space-x-3">
                            <input
                              type="url"
                              placeholder="URLを入力してください"
                              value={urlInputs[primaryCampaign.id] || ''}
                              onChange={(e) => setUrlInputs(prev => ({ ...prev, [primaryCampaign.id]: e.target.value }))}
                              className="flex-1 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border"
                              style={{ 
                                backgroundColor: ds.form.input.bg,
                                borderColor: ds.form.input.border,
                                color: ds.text.primary,
                                borderWidth: '1px',
                                borderStyle: 'solid'
                              }}
                            />
                            <button 
                              onClick={() => handleUrlSubmission(primaryCampaign.id, primaryCampaign.status)}
                              disabled={!!urlSubmitting[primaryCampaign.id]}
                              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                              style={{ 
                                backgroundColor: ds.button.primary.bg,
                                color: ds.button.primary.text
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.button.primary.hover}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ds.button.primary.bg}
                            >
                              {urlSubmitting[primaryCampaign.id] ? '送信中...' : '提出'}
                            </button>
                          </div>
                        </div>
                      )}

                      {action.inputType === 'payment' && (
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <label className="flex items-center space-x-3 text-sm cursor-pointer" style={{ color: ds.text.primary }}>
                              <input
                                type="checkbox"
                                checked={paymentCheckboxes[primaryCampaign.id]?.invoice || false}
                                onChange={(e) => handlePaymentCheckbox(primaryCampaign.id, 'invoice', e.target.checked)}
                                className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500 focus:ring-2"
                                style={{ 
                                  backgroundColor: ds.form.input.bg,
                                  borderColor: ds.form.input.border
                                }}
                              />
                              <span>
                                <a
                                  href={`https://docs.google.com/spreadsheets/d/1R7FffUOmZtlCo8Cm7TYOVTAixQ7Qz-ax3UC3rpgreVc/copy`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#60a5fa', textDecoration: 'underline' }}
                                >
                                  テンプレート
                                </a>
                                を利用し請求書を作成
                              </span>
                            </label>
                            <label className="flex items-center space-x-3 text-sm cursor-pointer" style={{ color: ds.text.primary }}>
                              <input
                                type="checkbox"
                                checked={paymentCheckboxes[primaryCampaign.id]?.form || false}
                                onChange={(e) => handlePaymentCheckbox(primaryCampaign.id, 'form', e.target.checked)}
                                className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500 focus:ring-2"
                                style={{ 
                                  backgroundColor: ds.form.input.bg,
                                  borderColor: ds.form.input.border
                                }}
                              />
                              <span>
                                <a
                                  href={`https://docs.google.com/forms/d/e/1FAIpQLSf5LXFdcD77wApBa2KxxoaBlGDGFu4pvIaI9HvfvnhJv-fDsg/viewform?usp=pp_url&entry.503165310=${encodeURIComponent(primaryCampaign.id)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#60a5fa', textDecoration: 'underline' }}
                                >
                                  こちらの
                                </a>
                                フォームを記入
                              </span>
                            </label>
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={() => handlePaymentSubmission(primaryCampaign.id)}
                              disabled={isProcessingPayment}
                              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                              style={{ 
                                backgroundColor: ds.button.primary.bg,
                                color: ds.button.primary.text
                              }}
                              onMouseEnter={(e) => !isProcessingPayment && (e.currentTarget.style.backgroundColor = ds.button.primary.hover)}
                              onMouseLeave={(e) => !isProcessingPayment && (e.currentTarget.style.backgroundColor = ds.button.primary.bg)}
                            >
                              {isProcessingPayment ? '処理中...' : '送金手続き開始'}
                            </button>
                          </div>
                        </div>
                      )}

                      {action.inputType === 'survey' && (
                        <div className="mt-2">
                          <OnboardingSurveyInline
                            campaignId={primaryCampaign.id}
                            onComplete={() => {
                              // Refresh the data after survey completion
                              refreshData();
                            }}
                            embedded
                          />
                        </div>
                      )}

                      {action.inputType === 'none' && (
                        <div className="text-sm" style={{ color: ds.text.secondary }}>
                          {/* No input needed for completed/waiting states */}
                        </div>
                      )}

                      {action.inputType === 'confirm_payment' && (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleConfirmPaymentCompleted(primaryCampaign.id)}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            style={{ backgroundColor: ds.button.primary.bg, color: ds.button.primary.text }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.button.primary.hover}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ds.button.primary.bg}
                          >
                            {confirmingCompleted[primaryCampaign.id] ? '更新中...' : '着金を確認しました'}
                          </button>
                          <a
                            href={`mailto:naoki@usespeak.com?subject=%E9%80%81%E9%87%91%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6%E5%95%8F%E3%81%84%E5%90%88%E3%82%8F%E3%81%9B&body=%E3%82%AD%E3%83%A3%E3%83%B3%E3%83%9A%E3%83%BC%E3%83%B3ID%3A%20${encodeURIComponent(primaryCampaign.id)}`}
                            className="text-sm"
                            style={{ color: '#60a5fa', textDecoration: 'underline' }}
                          >
                            送金について問い合わせる
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
            
            {/* Survey now rendered inside the action card when applicable */}
          </div>
        )}

        {/* Premium Usage Reminder - show under header, before stats */}
        {primaryCampaign && !hasUsedPremiumCreds && !premiumReminderDismissed && (
          <div className="mb-4 sm:mb-6">
            <div className="rounded-lg p-3 sm:p-4 flex items-start gap-3" style={{
              backgroundColor: ds.isDark ? '#1f2937' : '#ecfeff',
              borderColor: ds.isDark ? '#334155' : '#a5f3fc',
              borderWidth: '1px',
              borderStyle: 'solid'
            }}>
              <div className="flex-shrink-0 mt-0.5">
                <AlertCircle size={18} style={{ color: ds.text.accent }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: ds.text.primary }}>
                  スピークアプリのご利用をお忘れなく。プレミアムアカウントのメール／パスワード横のコピーアイコンをクリックして、ログインしてください。
                </p>
              </div>
              <button
                onClick={() => {
                  try {
                    if (primaryCampaign?.id && typeof window !== 'undefined') {
                      window.localStorage.setItem(`premiumReminderDismissed:${primaryCampaign.id}`, '1');
                    }
                  } catch {}
                  setPremiumReminderDismissed(true);
                }}
                className="flex-shrink-0 p-1 rounded hover:opacity-80"
                aria-label="dismiss premium reminder"
                title="閉じる"
                style={{ color: ds.text.secondary }}
              >
                <XCircle size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Status Section */}
        {primaryCampaign && (
          <div className="mb-6 sm:mb-8">
            <StatusSection campaign={primaryCampaign} />
          </div>
        )}

                {/* All Campaigns */}
        <div className="mb-6 sm:mb-8">
          {sortedUserCampaigns.length > 0 ? (
            <div className="space-y-4">
              <div className="rounded-xl p-4 sm:p-6" style={{ 
                backgroundColor: ds.bg.card,
                borderColor: ds.border.primary,
                borderWidth: '1px',
                borderStyle: 'solid'
              }}>
                <h3 className="font-semibold mb-4" style={{ color: ds.text.primary, fontSize: ds.typography.heading.h2.fontSize, lineHeight: ds.typography.heading.h2.lineHeight }}>
                  プロモーション詳細
                </h3>
                <div className="rounded-lg overflow-hidden isolate" style={{ 
                  borderColor: ds.border.primary,
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}>
                  <div 
                    className="relative max-h-[600px] overflow-y-auto scroll-smooth"
                    style={{ 
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
                    }}
                  >
                    <div className="overflow-x-auto">
                      <div className="min-w-[1400px]">
                        {/* Table Header */}
                        <div className="grid grid-cols-10 gap-6 px-6 py-3 border-b sticky top-0 z-10" style={{ borderColor: ds.border.secondary, backgroundColor: ds.bg.surface + '80' }}>
                          <div className="text-sm font-medium whitespace-nowrap min-w-[150px]" style={{ color: ds.text.secondary }}>キャンペーン名</div>
                          <div className="text-sm font-medium whitespace-nowrap min-w-[120px]" style={{ color: ds.text.secondary }}>プラットフォーム</div>
                          <div className="text-sm font-medium whitespace-nowrap min-w-[130px]" style={{ color: ds.text.secondary }}>ステータス</div>
                          <div className="text-sm font-medium whitespace-nowrap min-w-[100px]" style={{ color: ds.text.secondary }}>報酬</div>
                          <div className="text-sm font-medium whitespace-nowrap min-w-[100px]" style={{ color: ds.text.secondary }}>構成案提出</div>
                          <div className="text-sm font-medium whitespace-nowrap min-w-[100px]" style={{ color: ds.text.secondary }}>初稿提出</div>
                          <div className="text-sm font-medium whitespace-nowrap min-w-[100px]" style={{ color: ds.text.secondary }}>PR投稿</div>
                          <div className="text-sm font-medium whitespace-nowrap min-w-[80px]" style={{ color: ds.text.secondary }}>構成案リンク</div>
                          <div className="text-sm font-medium whitespace-nowrap min-w-[80px]" style={{ color: ds.text.secondary }}>初稿リンク</div>
                          <div className="text-sm font-medium whitespace-nowrap min-w-[80px]" style={{ color: ds.text.secondary }}>PR投稿リンク</div>
                        </div>

                        {/* Table Rows - All Campaigns */}
                        {sortedUserCampaigns.map(campaign => (
                          <div key={campaign.id} className="grid grid-cols-10 gap-6 px-6 py-3 border-b hover:bg-opacity-50" 
                               style={{ borderColor: ds.border.secondary }}
                               onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.bg.surface + '50'}
                               onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                            
                            {/* Campaign Name */}
                            <div className="text-sm font-medium min-w-[150px]" style={{ color: ds.text.primary }}>
                              <div className="min-w-[150px] max-w-[200px]">
                                <span className="block truncate" title={campaign.title}>
                                  {campaign.title}
                                </span>
                              </div>
                            </div>

                            {/* Platform */}
                            <div className="text-sm flex items-center space-x-2 min-w-[120px]" style={{ color: ds.text.primary }}>
                              <div className="min-w-[120px] flex items-center space-x-2">
                                <span className="text-base flex-shrink-0">
                                  {campaign.platform === 'youtube_long' && '🎥'}
                                  {campaign.platform === 'youtube_short' && '📱'}
                                  {campaign.platform === 'instagram_reel' && '📸'}
                                  {campaign.platform === 'tiktok' && '🎵'}
                                  {campaign.platform === 'x_twitter' && '🐦'}
                                  {campaign.platform === 'podcast' && '🎙️'}
                                  {campaign.platform === 'blog' && '✍️'}
                                </span>
                                <span className="text-xs whitespace-nowrap" style={{ color: ds.text.secondary }}>
                                  {campaign.platform === 'youtube_long' && 'YouTube長編'}
                                  {campaign.platform === 'youtube_short' && 'YouTubeショート'}
                                  {campaign.platform === 'instagram_reel' && 'Instagramリール'}
                                  {campaign.platform === 'tiktok' && 'TikTok'}
                                  {campaign.platform === 'x_twitter' && 'X (Twitter)'}
                                  {campaign.platform === 'podcast' && 'ポッドキャスト'}
                                  {campaign.platform === 'blog' && 'ブログ'}
                                </span>
                              </div>
                            </div>

                            {/* Status */}
                            <div className="text-sm min-w-[130px]">
                              <div className="min-w-[130px]">
                                <span 
                                  className="px-2 py-1 rounded text-xs font-medium whitespace-nowrap inline-block"
                                  style={{
                                    backgroundColor: ds.status[campaign.status as keyof typeof ds.status]?.bg || ds.status.not_started.bg,
                                    color: ds.status[campaign.status as keyof typeof ds.status]?.text || ds.status.not_started.text
                                  }}
                                >
                                  {campaign.status === 'not_started' && '未開始'}
                                  {campaign.status === 'meeting_scheduling' && '打ち合わせ予約中'}
                                  {campaign.status === 'meeting_scheduled' && '打ち合わせ予定'}
                                  {campaign.status === 'contract_pending' && '契約書待ち'}
                                  {campaign.status === 'plan_creating' && '構成案作成中'}
                                  {campaign.status === 'plan_submitted' && '構成案提出済み'}
                                  {campaign.status === 'plan_revising' && '構成案修正中'}
                                  {campaign.status === 'draft_creating' && '初稿作成中'}
                                  {campaign.status === 'draft_submitted' && '初稿提出済み'}
                                  {campaign.status === 'draft_revising' && '初稿修正中'}
                                  {campaign.status === 'scheduling' && '投稿準備中'}
                                  {campaign.status === 'scheduled' && '投稿済み'}
                                  {campaign.status === 'payment_processing' && '送金手続き中'}
                                  {campaign.status === 'completed' && '完了'}
                                  {campaign.status === 'cancelled' && 'キャンセル'}
                                </span>
                              </div>
                            </div>

                            {/* Price */}
                            <div className="text-sm font-semibold min-w-[100px]" style={{ color: ds.text.primary }}>
                              <div className="min-w-[100px] whitespace-nowrap">
                                <VisibilityToggle showToggleButton={false}>
                                  {formatCurrencySmart(campaign.contractedPrice || 0)}
                                </VisibilityToggle>
                              </div>
                            </div>

                            {/* Plan Submission Date */}
                            <div className="text-sm min-w-[100px]" style={{ color: ds.text.primary }}>
                              <div className="min-w-[100px] whitespace-nowrap">
                                {formatDate(campaign.schedules?.planSubmissionDate)}
                              </div>
                            </div>

                            {/* Draft Submission Date */}
                            <div className="text-sm min-w-[100px]" style={{ color: ds.text.primary }}>
                              <div className="min-w-[100px] whitespace-nowrap">
                                {formatDate(campaign.schedules?.draftSubmissionDate)}
                              </div>
                            </div>

                            {/* PR Launch Date */}
                            <div className="text-sm min-w-[100px]" style={{ color: ds.text.primary }}>
                              <div className="min-w-[100px] whitespace-nowrap">
                                {formatDate(campaign.schedules?.liveDate)}
                              </div>
                            </div>

                            {/* Plan Link */}
                            <div className="text-sm">
                              <div className="min-w-[60px] text-center">
                                {campaign.campaignData?.url_plan && campaign.campaignData.url_plan.trim() !== '' ? (
                                  <a
                                    href={getAbsoluteUrl(campaign.campaignData.url_plan)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center hover:underline"
                                    style={{ color: ds.text.accent }}
                                  >
                                    <ExternalLink size={12} />
                                  </a>
                                ) : (
                                  <span style={{ color: ds.text.secondary }}>-</span>
                                )}
                              </div>
                            </div>

                            {/* Draft Link */}
                            <div className="text-sm">
                              <div className="min-w-[60px] text-center">
                                {campaign.campaignData?.url_draft && campaign.campaignData.url_draft.trim() !== '' ? (
                                  <a
                                    href={getAbsoluteUrl(campaign.campaignData.url_draft)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center hover:underline"
                                    style={{ color: ds.text.accent }}
                                  >
                                    <ExternalLink size={12} />
                                  </a>
                                ) : (
                                  <span style={{ color: ds.text.secondary }}>-</span>
                                )}
                              </div>
                            </div>

                            {/* PR Content Link */}
                            <div className="text-sm">
                              <div className="min-w-[60px] text-center">
                                {campaign.campaignData?.url_content && campaign.campaignData.url_content.trim() !== '' ? (
                                  <a
                                    href={getAbsoluteUrl(campaign.campaignData.url_content)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center hover:underline"
                                    style={{ color: ds.text.accent }}
                                  >
                                    <ExternalLink size={12} />
                                  </a>
                                ) : (
                                  <span style={{ color: ds.text.secondary }}>-</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card text-center py-8">
              <p className="text-dark-text-secondary">
                プロモーションはありません
              </p>
            </div>
          )}
        </div>

        {/* Premium Account Section */}
        {primaryCampaign && (
          <div className="mt-6 sm:mt-8">
            <div className="rounded-xl p-4 sm:p-6" style={{ 
              backgroundColor: ds.bg.card,
              borderColor: ds.border.primary,
              borderWidth: '1px',
              borderStyle: 'solid'
            }}>
              <h3 className="font-semibold mb-4" style={{ color: ds.text.primary, fontSize: ds.typography.heading.h3.fontSize, lineHeight: ds.typography.heading.h3.lineHeight }}>
                プレミアムアカウント
              </h3>
              <div className="space-y-6">
                {/* App Download */}
                <div>
                  <p className="text-sm mb-3" style={{ color: ds.text.secondary }}>
                    まずはアプリをダウンロードしてください
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href="https://apps.apple.com/jp/app/ai%E8%8B%B1%E4%BC%9A%E8%A9%B1%E3%82%B9%E3%83%94%E3%83%BC%E3%82%AF-%E3%82%B9%E3%83%94%E3%83%BC%E3%82%AD%E3%83%B3%E3%82%B0%E7%B7%B4%E7%BF%92%E3%81%A7%E7%99%BA%E9%9F%B3%E3%82%84%E8%8B%B1%E8%AA%9E%E3%82%92%E5%8B%89%E5%BC%B7/id1286609883"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: ds.button.secondary.bg,
                        color: ds.button.secondary.text,
                        borderColor: ds.border.primary,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        textDecoration: 'none'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.hover}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.bg}
                    >
                      <ExternalLink size={14} className="mr-2" />
                      iOS
                    </a>
                    <a
                      href="https://play.google.com/store/apps/details?id=com.selabs.speak&hl=ja&pli=1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: ds.button.secondary.bg,
                        color: ds.button.secondary.text,
                        borderColor: ds.border.primary,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        textDecoration: 'none'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.hover}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.bg}
                    >
                      <ExternalLink size={14} className="mr-2" />
                      Android
                    </a>
                  </div>
                </div>

                {/* Login Credentials */}
                <div>
                  <p className="text-sm mb-3" style={{ color: ds.text.secondary }}>
                    以下の情報でログインしてください
                  </p>
                  
                  {/* Check if credentials are available */}
                  {!primaryCampaign.campaignData?.trial_login_email_dashboard || !primaryCampaign.campaignData?.trial_login_password_dashboard ? (
                    /* Error State */
                    <div className="p-4 rounded-lg" style={{ 
                      backgroundColor: ds.isDark ? '#2d1b1b' : '#fef2f2', // Dark mode: dark red, Light mode: light red
                      borderColor: ds.isDark ? '#7f1d1d' : '#fecaca', // Dark mode: darker red, Light mode: red border
                      borderWidth: '1px',
                      borderStyle: 'solid'
                    }}>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle size={16} style={{ color: '#ef4444' }} />
                        <span className="text-sm font-medium" style={{ 
                          color: ds.isDark ? '#f87171' : '#dc2626' // Dark mode: lighter red, Light mode: dark red
                        }}>
                          取得に失敗しました
                        </span>
                      </div>
                      <p className="text-xs mb-3" style={{ 
                        color: ds.isDark ? '#dc2626' : '#7f1d1d' // Dark mode: medium red, Light mode: darker red
                      }}>
                        ログイン情報を取得できませんでした。サポートにお問い合わせください。
                      </p>
                      <button
                        onClick={() => {
                          const subject = encodeURIComponent('プレミアムアカウント情報取得エラー');
                          const body = encodeURIComponent(`キャンペーンID: ${primaryCampaign.id}\nエラー内容: ログイン情報（trial_login_email_dashboard, trial_login_password_dashboard）が取得できませんでした。`);
                          window.open(`mailto:partnerships_jp@usespeak.com?subject=${subject}&body=${body}`, '_blank');
                        }}
                        className="inline-flex items-center px-3 py-1.5 text-xs rounded-lg transition-colors"
                        style={{
                          backgroundColor: '#dc2626',
                          color: 'white'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                      >
                        <ExternalLink size={12} className="mr-1" />
                        サポートに報告
                      </button>
                    </div>
                  ) : (
                    /* Success State */
                    <div className="space-y-3">
                      {/* Email */}
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: ds.text.secondary }}>
                          メールアドレス
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 px-3 py-2 rounded-lg font-mono text-sm" style={{ 
                            backgroundColor: ds.bg.surface,
                            borderColor: ds.border.secondary,
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            color: ds.text.primary
                          }}>
                            {primaryCampaign.campaignData.trial_login_email_dashboard}
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(primaryCampaign.campaignData!.trial_login_email_dashboard!);
                              setCopiedEmail(true);
                              setTimeout(() => setCopiedEmail(false), 2000);
                              markPremiumCredsUsed();
                            }}
                            className="p-2 rounded-lg transition-colors"
                            style={{
                              backgroundColor: ds.button.secondary.bg,
                              color: ds.button.secondary.text,
                              borderColor: ds.border.primary,
                              borderWidth: '1px',
                              borderStyle: 'solid'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.hover}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.bg}
                            title={copiedEmail ? 'コピーしました' : 'コピー'}
                          >
                            {copiedEmail ? <ClipboardCheck size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: ds.text.secondary }}>
                          パスワード
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 px-3 py-2 rounded-lg font-mono text-sm" style={{ 
                            backgroundColor: ds.bg.surface,
                            borderColor: ds.border.secondary,
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            color: ds.text.primary
                          }}>
                            {primaryCampaign.campaignData.trial_login_password_dashboard}
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(primaryCampaign.campaignData!.trial_login_password_dashboard!);
                              setCopiedPassword(true);
                              setTimeout(() => setCopiedPassword(false), 2000);
                              markPremiumCredsUsed();
                            }}
                            className="p-2 rounded-lg transition-colors"
                            style={{
                              backgroundColor: ds.button.secondary.bg,
                              color: ds.button.secondary.text,
                              borderColor: ds.border.primary,
                              borderWidth: '1px',
                              borderStyle: 'solid'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.hover}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.bg}
                            title={copiedPassword ? 'コピーしました' : 'コピー'}
                          >
                            {copiedPassword ? <ClipboardCheck size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Links Section - moved to bottom */}
        {primaryCampaign && (
          <div className="mt-6 sm:mt-8">
            <div className="rounded-xl p-4 sm:p-6" style={{ 
              backgroundColor: ds.bg.card,
              borderColor: ds.border.primary,
              borderWidth: '1px',
              borderStyle: 'solid'
            }}>
              <h3 className="font-semibold mb-4" style={{ color: ds.text.primary, fontSize: ds.typography.heading.h3.fontSize, lineHeight: ds.typography.heading.h3.lineHeight }}>
                リンク
              </h3>
              <div className="space-y-2 text-sm">
                {(() => {
                  const url = getGuidelineUrl(primaryCampaign.platform as string);
                  if (!url) return null;
                  return (
                    <div className="flex items-center space-x-2">
                      <ExternalLink size={14} style={{ color: ds.text.accent }} />
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: ds.text.accent, textDecoration: 'underline' }}
                      >
                        ガイドライン
                      </a>
                    </div>
                  );
                })()}
                <div className="flex items-center space-x-2">
                  <ExternalLink size={14} style={{ color: ds.text.accent }} />
                  <a
                    href="https://docs.google.com/document/d/13Ljg7rR8hsaZflGt3N0sB_g9ad-391G7Nhl4ICwVybg/copy"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: ds.text.accent, textDecoration: 'underline' }}
                  >
                    ドラフトテンプレート
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  <ExternalLink size={14} style={{ color: ds.text.accent }} />
                  <a
                    href="https://docs.google.com/spreadsheets/d/1R7FffUOmZtlCo8Cm7TYOVTAixQ7Qz-ax3UC3rpgreVc/copy"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: ds.text.accent, textDecoration: 'underline' }}
                  >
                    請求書テンプレート
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </AmountVisibilityProvider>
  );
}

