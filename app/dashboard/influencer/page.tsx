'use client';

import { useAuth } from '@/contexts/AuthContext';
import { mockCampaigns } from '@/lib/mock-data';
import CampaignCard from '@/components/CampaignCard';
import StatusSection from '@/components/StatusSection';
import OnboardingSurvey from '@/components/OnboardingSurvey';
import OnboardingSurveyInline from '@/components/OnboardingSurveyInline';
import { TrendingUp, Clock, CheckCircle, Calendar, ExternalLink, Settings, Bug, AlertCircle, ClipboardList, FileText, FileEdit, Video, Megaphone, CreditCard, Hourglass, XCircle } from 'lucide-react';
import PreviousStepMessage from '@/components/PreviousStepMessage';
import { useState, useEffect } from 'react';
import { CampaignStatus, getStepFromStatus } from '@/types';
import { useDesignSystem } from '@/hooks/useDesignSystem';
import { formatAbbreviatedCurrency } from '@/lib/design-system';

export default function InfluencerDashboard() {
  const { user } = useAuth();
  const ds = useDesignSystem();
  const [campaigns, setCampaigns] = useState(mockCampaigns);
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

  // Manual refresh function
  const refreshData = async () => {
    if (user?.id) {
      setIsLoading(true);
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
        setCampaigns(mockCampaigns);
      } finally {
        setIsLoading(false);
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
          setCampaigns(mockCampaigns);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchCampaigns();
  }, [user?.id]);
  
  if (!user || user.role !== 'influencer') {
    return <div>アクセスが拒否されました</div>;
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
  const activeCampaigns = userCampaigns.filter(campaign => 
    !['completed', 'cancelled'].includes(campaign.status)
  );
  const completedCampaigns = userCampaigns.filter(campaign => 
    campaign.status === 'completed'
  );

  const totalEarnings = userCampaigns
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
        // Dynamic title based on meeting status
        let meetingTitle = '打ち合わせの予約';
        if (campaign.meetingStatus === 'scheduled') {
          meetingTitle = '打ち合わせへの参加';
        } else if (campaign.meetingStatus === 'completed') {
          // Show plan creation action instead
          return {
            title: '構成案の作成',
            description: 'プロモーションの構成案を作成しリンクを共有してください',
            icon: AlertCircle,
            color: 'blue',
            action: 'plan',
            inputType: 'url'
          };
        }
        
        // Dynamic description based on meeting status
        let meetingDescription = '<a href="https://calendly.com/speak-naoki/30min-1" target="_blank" style="color: #60a5fa; text-decoration: underline;">こちらから</a>打ち合わせを予約し、以下のステータスを変更してください';
        if (campaign.meetingStatus === 'scheduled') {
          meetingDescription = '<a href="https://calendly.com/speak-naoki/30min-1" target="_blank" style="color: #60a5fa; text-decoration: underline;">こちらから</a>打ち合わせに参加し、以下のステータスを変更してください';
        }
        
        return {
          title: meetingTitle,
          description: meetingDescription,
          icon: Calendar,
          color: 'blue',
          action: 'meeting',
          inputType: 'meeting'
        };

      case 'plan_creation':
        // Show different actions based on current status within the step
        if (campaign.status === 'plan_creating') {
          return {
            title: '構成案の作成',
            description: 'プロモーションの構成案を作成しリンクを共有してください',
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
          return {
            title: '構成案の修正',
            description: 'フィードバックに基づいて構成案を修正し、再提出してください',
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
          return {
            title: '初稿の修正',
            description: 'フィードバックに基づいて初稿を修正し、再提出してください',
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
    const stepOrder = ['meeting', 'plan_creation', 'draft_creation', 'scheduling', 'payment'];
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

  // Get days left for the primary campaign
  const daysUntilLive = primaryCampaign ? getDaysUntilLive(primaryCampaign) : null;

  // Check if action is overdue (more than 1 day past due)
  const isActionOverdue = (campaign: any) => {
    if (!campaign.schedules?.liveDate) return false;
    
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
    const confirmMessage = `ステータスを「${status === 'not_scheduled' ? '予約未完了' : status === 'scheduled' ? '予約済み' : '打ち合わせ完了'}」に変更しますか？`;
    
    if (window.confirm(confirmMessage)) {
      try {
        setMeetingUpdating(prev => ({ ...prev, [campaignId]: true }));
        let newStatus: string;
        
        if (status === 'completed') {
          newStatus = 'plan_creating'; // Advance to plan creation step
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
    const ok = window.confirm('着金を確認しましたか？この操作は取り消せません。');
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
    const stepOrder = ['meeting', 'plan_creation', 'draft_creation', 'scheduling', 'payment'];
    const currentStepIndex = stepOrder.indexOf(currentStep);
    
    if (currentStepIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentStepIndex + 1];
      
      // Map next step to appropriate status
      let nextStatus: CampaignStatus;
      switch (nextStep) {
        case 'plan_creation':
          nextStatus = 'plan_creating';
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
    <div className="min-h-screen" style={{ backgroundColor: ds.bg.primary }}>
      <div className="max-w-7xl mx-auto mobile-padding">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: ds.text.primary }}>
              お疲れ様です、{user.name}さん
            </h1>
            {/* Debug Toggle Button - Only for demo accounts */}
            {(user.id === 'actre_vlog_yt' || user.id === 'eigatube_yt') && (
              <>
                <button
                  onClick={() => setShowDebugCard(!showDebugCard)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ 
                    backgroundColor: ds.button.secondary.bg,
                    color: ds.button.secondary.text
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.hover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.bg}
                >
                  <Bug size={16} />
                  <span>デバッグ</span>
                </button>
                <button
                  onClick={refreshData}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  style={{ 
                    backgroundColor: ds.button.primary.bg,
                    color: ds.button.primary.text
                  }}
                  onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = ds.button.primary.hover)}
                  onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = ds.button.primary.bg)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{isLoading ? '更新中...' : '更新'}</span>
                </button>
              </>
            )}
          </div>
          {primaryCampaign ? (
            <PreviousStepMessage status={primaryCampaign.status} />
          ) : (
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
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: ds.button.primary.bg }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold" style={{ color: ds.text.primary }}>
                  {formatAbbreviatedCurrency(activeCampaigns.length > 0 ? (activeCampaigns[0].contractedPrice || 0) : 0)}
                </p>
                <p className="text-xs sm:text-sm" style={{ color: ds.text.secondary }}>進行中PRの報酬額</p>
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
              <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: '#22c55e' + '20' }}>
                <CheckCircle size={20} style={{ color: '#22c55e' }} />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold" style={{ color: ds.text.primary }}>
                  {daysUntilLive !== null ? (
                    daysUntilLive > 0 ? `${daysUntilLive}日` : 
                    daysUntilLive === 0 ? '今日' : 
                    `${Math.abs(daysUntilLive)}日遅れ`
                  ) : '未設定'}
                </p>
                <p className="text-xs sm:text-sm" style={{ color: ds.text.secondary }}>PRまでの日数</p>
              </div>
            </div>
          </div>
      </div>

        {/* Action Section */}
        {primaryCampaign && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6" style={{ color: ds.text.primary }}>
              次のステップ
            </h2>
            {getOverdueErrorMessage(primaryCampaign) && (
              <div className="mb-4 p-3 border rounded-lg" style={{ 
                backgroundColor: '#ef4444' + '10',
                borderColor: '#ef4444' + '20'
              }}>
                <p className="text-sm font-medium" style={{ color: '#f87171' }}>
                  {getOverdueErrorMessage(primaryCampaign)}
                </p>
              </div>
            )}
            <div className="rounded-xl p-4 sm:p-6" style={{ 
              backgroundColor: ds.bg.card,
              borderColor: ds.border.primary,
              borderWidth: '1px',
              borderStyle: 'solid'
            }}>
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
                            href="mailto:naoki@usespeak.com?subject=%E9%80%81%E9%87%91%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6%E5%95%8F%E3%81%84%E5%90%88%E3%82%8F%E3%81%9B&body=%E3%82%AD%E3%83%A3%E3%83%B3%E3%83%9A%E3%83%BC%E3%83%B3ID%3A%20"
                            className="text-sm"
                            style={{ color: '#60a5fa', textDecoration: 'underline' }}
                          >
                            送金について問い合わせる
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
                      {action.inputType === 'meeting' && (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm" style={{ color: ds.text.secondary }}>ステータス:</span>
                            <select
                              value={primaryCampaign.meetingStatus || 'not_scheduled'}
                              onChange={(e) => handleMeetingStatusChange(primaryCampaign.id, e.target.value as 'not_scheduled' | 'scheduled' | 'completed')}
                              disabled={!!meetingUpdating[primaryCampaign.id]}
                              className="px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              style={{ 
                                backgroundColor: ds.form.input.bg,
                                borderColor: ds.form.input.border,
                                color: ds.text.primary
                              }}
                            >
                                                              <option value="not_scheduled" style={{ backgroundColor: ds.form.input.bg, color: ds.text.primary }}>予約未完了</option>
                                <option value="scheduled" style={{ backgroundColor: ds.form.input.bg, color: ds.text.primary }}>予約済み</option>
                                <option value="completed" style={{ backgroundColor: ds.form.input.bg, color: ds.text.primary }}>打ち合わせ完了</option>
                            </select>
                          </div>
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
                                  href={`https://docs.google.com/forms/d/e/1FAIpQLSeVeZAPnB3YdyU2L3b9dqUUYOcVtijPnY6VYLX9Dq-O5rThLA/viewform?usp=pp_url&entry.1107506212=${encodeURIComponent(primaryCampaign.id)}`}
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
                            href="mailto:naoki@usespeak.com?subject=%E9%80%81%E9%87%91%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6%E5%95%8F%E3%81%84%E5%90%88%E3%82%8F%E3%81%9B&body=%E3%82%AD%E3%83%A3%E3%83%B3%E3%83%9A%E3%83%BC%E3%83%B3ID%3A%20"
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

        {/* Status Section */}
        {primaryCampaign && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6" style={{ color: ds.text.primary }}>
              PRの流れとステータス
            </h2>
            <StatusSection campaign={primaryCampaign} />
          </div>
        )}

        {/* Active Campaigns */}
        <div className="mb-6 sm:mb-8">
                      <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6" style={{ color: ds.text.primary }}>
              プロモーション詳細
            </h2>
          {activeCampaigns.length > 0 ? (
            <div className="space-y-4">
              {activeCampaigns.map(campaign => (
                <div key={campaign.id} className="rounded-xl p-4 sm:p-6" style={{ 
                  backgroundColor: ds.bg.card,
                  borderColor: ds.border.primary,
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}>
                  {/* Always expanded for influencer view */}
                  <div className="mobile-flex mb-4">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="text-base sm:text-lg flex-shrink-0">
                        {campaign.platform === 'youtube_long' && '🎥'}
                        {campaign.platform === 'youtube_short' && '📱'}
                        {campaign.platform === 'instagram_reel' && '📸'}
                        {campaign.platform === 'tiktok' && '🎵'}
                        {campaign.platform === 'x_twitter' && '🐦'}
                        {campaign.platform === 'podcast' && '🎙️'}
                        {campaign.platform === 'blog' && '✍️'}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium mobile-text truncate" style={{ color: ds.text.primary }}>
                          {campaign.title}
                        </h3>
                        <p className="text-xs sm:text-sm" style={{ color: ds.text.secondary }}>
                          {campaign.platform === 'youtube_long' && 'YouTube長編'}
                          {campaign.platform === 'youtube_short' && 'YouTubeショート'}
                          {campaign.platform === 'instagram_reel' && 'Instagramリール'}
                          {campaign.platform === 'tiktok' && 'TikTok'}
                          {campaign.platform === 'x_twitter' && 'X (Twitter)'}
                          {campaign.platform === 'podcast' && 'ポッドキャスト'}
                          {campaign.platform === 'blog' && 'ブログ'}
                        </p>
                      </div>
                    </div>
                  
                    <div 
                      className="status-badge flex-shrink-0"
                      style={{
                        backgroundColor: ds.status[campaign.status as keyof typeof ds.status]?.bg || ds.status.not_started.bg,
                        color: ds.status[campaign.status as keyof typeof ds.status]?.text || ds.status.not_started.text,
                        borderColor: ds.status[campaign.status as keyof typeof ds.status]?.border || ds.status.not_started.border
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
                  </div>
                </div>

                {/* Always show expanded content */}
                <div className="space-y-4">
                  {/* Price and Next Step */}
                  <div className="mobile-grid gap-4">
                    <div className="flex items-center space-x-2 text-xs sm:text-sm">
                      <span className="font-medium" style={{ color: ds.text.primary }}>
                        {formatAbbreviatedCurrency(campaign.contractedPrice || 0)}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm">
                      <p className="font-medium mb-1" style={{ color: ds.text.primary }}>次のステップ：</p>
                      <p style={{ color: ds.text.secondary }}>
                        {campaign.status === 'not_started' && '基本情報の入力を完了してください'}
                        {campaign.status === 'meeting_scheduling' && '打ち合わせの予約をお待ちください'}
                        {campaign.status === 'meeting_scheduled' && '打ち合わせにご参加ください'}
                        {campaign.status === 'contract_pending' && '契約書をご確認・サインしてください'}
                        {campaign.status === 'plan_creating' && '構成案の作成を開始してください'}
                        {campaign.status === 'plan_submitted' && '構成案の確認をお待ちください'}
                        
                        {campaign.status === 'plan_revising' && '修正版構成案をご提出ください'}
                        {campaign.status === 'draft_creating' && '初稿の作成を開始してください'}
                        {campaign.status === 'draft_submitted' && '初稿の確認をお待ちください'}

                        {campaign.status === 'draft_revising' && '修正版初稿をご提出ください'}
                        {campaign.status === 'scheduling' && 'コンテンツを投稿してください'}
                        {campaign.status === 'scheduled' && '送金手続きをお待ちください'}
                        {campaign.status === 'payment_processing' && 'お支払い処理中です'}
                        {campaign.status === 'completed' && 'プロモーション完了'}
                      </p>
                    </div>
                  </div>

                  {/* Schedule - key dates */}
                  <div>
                    <p className="font-medium mb-2" style={{ color: ds.text.primary }}>スケジュール</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center space-x-2" style={{ color: ds.text.secondary }}>
                        <Calendar size={14} />
                        <div>
                          <p className="font-medium" style={{ color: ds.text.primary }}>構成案提出</p>
                          <p>{formatDate(campaign.schedules?.planSubmissionDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2" style={{ color: ds.text.secondary }}>
                        <Calendar size={14} />
                        <div>
                          <p className="font-medium" style={{ color: ds.text.primary }}>初稿提出</p>
                          <p>{formatDate(campaign.schedules?.draftSubmissionDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2" style={{ color: ds.text.secondary }}>
                        <Calendar size={14} />
                        <div>
                          <p className="font-medium" style={{ color: ds.text.primary }}>PR投稿</p>
                          <p>{formatDate(campaign.schedules?.liveDate)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submission Links */}
                  <div>
                    <p className="font-medium mb-2" style={{ color: ds.text.primary }}>提出リンク</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center space-x-2">
                        {campaign.campaignData?.url_plan && campaign.campaignData.url_plan.trim() !== '' ? (
                          <a
                            href={getAbsoluteUrl(campaign.campaignData.url_plan)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2"
                            style={{ color: ds.text.accent }}
                          >
                            <ExternalLink size={14} />
                            <span>構成案リンク</span>
                          </a>
                        ) : (
                          <>
                            <span className="font-medium" style={{ color: ds.text.primary }}>構成案リンク</span>
                            <span style={{ color: ds.text.secondary }}>未提出</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {campaign.campaignData?.url_draft && campaign.campaignData.url_draft.trim() !== '' ? (
                          <a
                            href={getAbsoluteUrl(campaign.campaignData.url_draft)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2"
                            style={{ color: ds.text.accent }}
                          >
                            <ExternalLink size={14} />
                            <span>初稿リンク</span>
                          </a>
                        ) : (
                          <>
                            <span className="font-medium" style={{ color: ds.text.primary }}>初稿リンク</span>
                            <span style={{ color: ds.text.secondary }}>未提出</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {campaign.campaignData?.url_content && campaign.campaignData.url_content.trim() !== '' ? (
                          <a
                            href={getAbsoluteUrl(campaign.campaignData.url_content)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2"
                            style={{ color: ds.text.accent }}
                          >
                            <ExternalLink size={14} />
                            <span>PR投稿リンク</span>
                          </a>
                        ) : (
                          <>
                            <span className="font-medium" style={{ color: ds.text.primary }}>PR投稿リンク</span>
                            <span style={{ color: ds.text.secondary }}>未提出</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Requirements */}
                  {campaign.requirements.length > 0 && (
                    <div>
                      <p className="font-medium text-dark-text mb-2">要件</p>
                      <ul className="space-y-1 text-sm text-dark-text-secondary">
                        {campaign.requirements.map((req, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-dark-accent mt-1">•</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Reference Links */}
                  {campaign.referenceLinks.length > 0 && (
                    <div>
                      <div className="space-y-1">
                        {campaign.referenceLinks.map((link, index) => (
                          <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-sm text-dark-accent hover:text-dark-accent-hover transition-colors"
                          >
                            <span>{link.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-8">
            <p className="text-dark-text-secondary">
              現在進行中のプロモーションはありません
            </p>
          </div>
        )}
      </div>

        {/* Completed Campaigns */}
        {completedCampaigns.length > 0 && (
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-dark-text mb-4 sm:mb-6">
              完了済みプロモーション
            </h2>
          <div className="space-y-4">
            {completedCampaigns.map(campaign => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
            </div>
          </div>
        )}

        {/* Links Section - moved to bottom */}
        {primaryCampaign && (
          <div className="mt-6 sm:mt-8">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6" style={{ color: ds.text.primary }}>
              リンク
            </h2>
            <div className="rounded-xl p-4 sm:p-6" style={{ 
              backgroundColor: ds.bg.card,
              borderColor: ds.border.primary,
              borderWidth: '1px',
              borderStyle: 'solid'
            }}>
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
  );
}

