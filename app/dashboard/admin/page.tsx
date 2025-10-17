'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Users, TrendingUp, Clock, AlertCircle, Search, Filter, User, Tag, ChevronUp, ChevronDown, ExternalLink, Check, X, RefreshCw, Mail, Settings, Copy } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Campaign, Update, ChangeRequest } from '@/types';
import { useDesignSystem } from '@/hooks/useDesignSystem';
import { formatAbbreviatedCurrency, colors } from '@/lib/design-system';
import CommsPanel from '@/components/CommsPanel';
import { SettingsPanel } from '@/components/Settings';

export default function AdminDashboard() {
  console.log('🎯 AdminDashboard component rendering');
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const ds = useDesignSystem();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingActions, setProcessingActions] = useState<Set<string>>(new Set());
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [currentRevisionAction, setCurrentRevisionAction] = useState<{update: Update, action: string} | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{
    influencerName: string;
    influencerEmail: string;
    feedbackMessage: string;
    submissionType: string;
  } | null>(null);
  const [showAllUpdates, setShowAllUpdates] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'actions' | 'comms' | 'settings'>('dashboard');
  const [reminderSending, setReminderSending] = useState<Set<string>>(new Set());
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const [queuedEmailActions, setQueuedEmailActions] = useState<Array<{campaignId: string; influencerId: string; influencerName: string; submissionType: 'plan' | 'draft'; followupType: 'approval' | 'revision'}>>([]);
  
  console.log('👤 Current user:', user);

  // Ensure external links open correctly even if protocol is omitted
  const getAbsoluteUrl = (url: string | undefined | null) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed.replace(/^\/+/, '')}`;
  };

  // Fetch helper with timeout to avoid hanging spinners
  const fetchWithTimeout = async (
    input: RequestInfo | URL,
    init?: RequestInit & { timeoutMs?: number }
  ) => {
    const { timeoutMs = 15000, ...rest } = init || {};
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(input, {
        cache: 'no-store',
        ...rest,
        signal: controller.signal,
      });
      return res;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        console.error('⌛ Fetch timed out:', input.toString());
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Manual refresh function
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 Manual refresh: Fetching campaigns and updates from API...');
      
      // Fetch campaigns
      const campaignsResponse = await fetchWithTimeout(`/api/campaigns?t=${Date.now()}`);
      if (campaignsResponse.ok) {
        const campaigns = await campaignsResponse.json();
        console.log('✅ Manual refresh: Campaigns loaded:', campaigns.length);
        setAllCampaigns(campaigns);
      } else {
        console.error('❌ Manual refresh: Failed to fetch campaigns:', campaignsResponse.status);
      }
      
      // Fetch updates
      const updatesResponse = await fetchWithTimeout(`/api/updates?t=${Date.now()}`);
      if (updatesResponse.ok) {
        const updates = await updatesResponse.json();
        console.log('✅ Manual refresh: Updates loaded:', updates.length);
        setUpdates(updates);
      } else {
        console.error('❌ Manual refresh: Failed to fetch updates:', updatesResponse.status);
      }

      // Fetch pending requests
      const requestsResponse = await fetchWithTimeout(`/api/requests?status=pending&t=${Date.now()}`);
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        console.log('✅ Manual refresh: Pending requests loaded:', requestsData.requests?.length || 0);
        setPendingRequests(requestsData.requests || []);
      } else {
        console.error('❌ Manual refresh: Failed to fetch requests:', requestsResponse.status);
      }
    } catch (error) {
      console.error('❌ Manual refresh: Error fetching data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch campaigns and updates from API - must be before early returns
  useEffect(() => {
    console.log('🔍 useEffect for fetchData triggered. isAuthLoading:', isAuthLoading, 'user:', user?.email, 'role:', user?.role);
    
    // Only fetch after auth has resolved and user is confirmed admin
    if (isAuthLoading) {
      console.log('⏳ Auth still loading, skipping fetch');
      return;
    }
    if (!user || user.role !== 'admin') {
      console.log('❌ User not admin or not logged in, skipping fetch');
      return;
    }

    const fetchData = async () => {
      try {
        console.log('📊 Fetching campaigns and updates from API (admin confirmed)...');
        setLoading(true);

        const ts = Date.now();
        const [campaignsResponse, updatesResponse, requestsResponse] = await Promise.all([
          fetchWithTimeout(`/api/campaigns?t=${ts}`),
          fetchWithTimeout(`/api/updates?t=${ts}`),
          fetchWithTimeout(`/api/requests?status=pending&t=${ts}`)
        ]);

        if (campaignsResponse.ok) {
          const campaigns = await campaignsResponse.json();
          console.log('✅ Campaigns loaded:', campaigns.length);
          console.log('📊 First 3 campaigns:', campaigns.slice(0, 3));
          setAllCampaigns(campaigns);
          console.log('✅ setAllCampaigns called with', campaigns.length, 'campaigns');
        } else {
          console.error('❌ Failed to fetch campaigns:', campaignsResponse.status);
        }

        if (updatesResponse.ok) {
          const updates = await updatesResponse.json();
          console.log('✅ Updates loaded:', updates.length);
          setUpdates(updates);
        } else {
          console.error('❌ Failed to fetch updates:', updatesResponse.status);
        }

        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json();
          console.log('✅ Pending requests loaded:', requestsData.requests?.length || 0);
          setPendingRequests(requestsData.requests || []);
        } else {
          console.error('❌ Failed to fetch requests:', requestsResponse.status);
        }
      } catch (error) {
        console.error('❌ Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isAuthLoading]);

  // Debug: Log whenever allCampaigns changes
  useEffect(() => {
    console.log('🔄 allCampaigns state updated. Length:', allCampaigns.length);
    if (allCampaigns.length > 0) {
      console.log('📊 Sample campaign:', allCampaigns[0]);
    }
  }, [allCampaigns]);

  // Load queued follow-up actions from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('postEmailActions');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setQueuedEmailActions(parsed);
      }
    } catch (e) {
      console.warn('Failed to load postEmailActions from localStorage');
    }
  }, []);
  
  // Redirect unauthenticated users or non-admins
  useEffect(() => {
    // Wait for auth loading to complete before redirecting
    if (isAuthLoading) return;
    
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [user, isAuthLoading, router]);

  // Handle column sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sorting function
  const sortCampaigns = (campaigns: Campaign[]) => {
    if (!sortField) return campaigns;
    
    return [...campaigns].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'contractedPrice':
          aValue = a.contractedPrice || 0;
          bValue = b.contractedPrice || 0;
          break;
        case 'planSubmissionDate':
          aValue = a.schedules?.planSubmissionDate ? new Date(a.schedules.planSubmissionDate).getTime() : 0;
          bValue = b.schedules?.planSubmissionDate ? new Date(b.schedules.planSubmissionDate).getTime() : 0;
          break;
        case 'draftSubmissionDate':
          aValue = a.schedules?.draftSubmissionDate ? new Date(a.schedules.draftSubmissionDate).getTime() : 0;
          bValue = b.schedules?.draftSubmissionDate ? new Date(b.schedules.draftSubmissionDate).getTime() : 0;
          break;
        case 'liveDate':
          aValue = a.schedules?.liveDate ? new Date(a.schedules.liveDate).getTime() : 0;
          bValue = b.schedules?.liveDate ? new Date(b.schedules.liveDate).getTime() : 0;
          break;
        case 'updatedAt':
          const aDate = a.campaignData?.date_status_updated;
          const bDate = b.campaignData?.date_status_updated;
          aValue = aDate && aDate !== '' && aDate !== 'undefined' ? new Date(aDate).getTime() : 0;
          bValue = bDate && bDate !== '' && bDate !== 'undefined' ? new Date(bDate).getTime() : 0;
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  };

  // Filter and sort campaigns
  const filteredCampaigns = useMemo(() => {
    console.log('🔍 Filtering campaigns. allCampaigns.length:', allCampaigns.length);
    console.log('🔍 Filters:', { searchTerm, statusFilter, platformFilter });
    
    const filtered = allCampaigns.filter(campaign => {
      const influencerName = campaign.influencerName || campaign.title || '';
      const matchesSearch = influencerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           campaign.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Handle special status filters
      let matchesStatus = true;
      if (statusFilter === 'ongoing') {
        // Ongoing: has status_dashboard and not completed/cancelled
        const raw = (campaign as any).statusDashboard as string | undefined;
        const hasRaw = typeof raw === 'string' && raw.trim().length > 0;
        matchesStatus = hasRaw && !['completed', 'cancelled'].includes(campaign.status);
      } else if (statusFilter === 'action_required') {
        // Action required: plan_submitted or draft_submitted
        matchesStatus = ['plan_submitted', 'draft_submitted'].includes(campaign.status);
      } else if (statusFilter !== 'all') {
        // Regular status filter
        matchesStatus = campaign.status === statusFilter;
      }
      
      const matchesPlatform = platformFilter === 'all' || campaign.platform === platformFilter;
      
      return matchesSearch && matchesStatus && matchesPlatform;
    });
    
    console.log('🔍 Filtered campaigns count:', filtered.length);
    
    return sortCampaigns(filtered);
  }, [allCampaigns, searchTerm, statusFilter, platformFilter, sortField, sortDirection]);
  
  // Compute reminder items once for reuse (tab badge + list)
  const reminderItems = useMemo(() => {
    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;

    const daysSinceStatusUpdated = (campaign: Campaign) => {
      const updatedRaw = campaign.campaignData?.date_status_updated || campaign.updatedAt?.toString();
      if (!updatedRaw) return null;
      const updatedAt = new Date(updatedRaw);
      if (isNaN(updatedAt.getTime())) return null;
      return Math.floor((now.getTime() - updatedAt.getTime()) / msPerDay);
    };

    const daysUntilDeadline = (dateString: string | null | undefined) => {
      if (!dateString || String(dateString).trim() === '') return null;
      const due = new Date(String(dateString));
      if (isNaN(due.getTime())) return null;
      return Math.ceil((due.getTime() - now.getTime()) / msPerDay);
    };

    const getRelevantDeadline = (campaign: Campaign): { days: number | null; type: string; label: string } => {
      const status = String(campaign.status || '');
      
      // Check plan deadline for plan-related statuses
      if (['plan_creating', 'plan_submitted', 'plan_revising'].includes(status)) {
        const days = daysUntilDeadline(campaign.schedules?.planSubmissionDate);
        return { days, type: 'plan', label: '構成案提出期限' };
      }
      
      // Check draft deadline for draft-related statuses
      if (['draft_creating', 'draft_submitted', 'draft_revising'].includes(status)) {
        const days = daysUntilDeadline(campaign.schedules?.draftSubmissionDate);
        return { days, type: 'draft', label: '初稿提出期限' };
      }
      
      // Check live date for scheduling/posting statuses
      if (['scheduling', 'scheduled'].includes(status)) {
        const days = daysUntilDeadline(campaign.schedules?.liveDate);
        return { days, type: 'live', label: '投稿予定日' };
      }
      
      // For other statuses, check draft deadline (most common)
      const days = daysUntilDeadline(campaign.schedules?.draftSubmissionDate);
      return { days, type: 'draft', label: '初稿提出期限' };
    };

    type ActionItem = { campaign: Campaign; kind: 'trial' | 'meeting' | 'overdue'; reason: string };
    const items: ActionItem[] = [];
    for (const c of allCampaigns) {
      const status = String(c.status || '');
      const since = daysSinceStatusUpdated(c);
      const deadline = getRelevantDeadline(c);
      const untilDeadline = deadline.days;
      
      if (status === 'trial' && since !== null && since > 3 && untilDeadline !== null && untilDeadline > 0 && untilDeadline < 10) {
        items.push({ campaign: c, kind: 'trial', reason: 'トライアルリマインダー' });
      }
      if (status === 'meeting_scheduling' && since !== null && since >= 3 && untilDeadline !== null && untilDeadline > 0 && untilDeadline < 30) {
        items.push({ campaign: c, kind: 'meeting', reason: '打ち合わせリマインダー' });
      }
      // Overdue campaigns - deadline has passed but not yet completed
      if (untilDeadline !== null && untilDeadline < 0 && !['completed', 'cancelled'].includes(status)) {
        const daysOverdue = Math.abs(untilDeadline);
        items.push({ campaign: c, kind: 'overdue', reason: `${deadline.label}超過 (${daysOverdue}日遅れ)` });
      }
    }
    return items;
  }, [allCampaigns]);
  
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

  if (!user || user.role !== 'admin') {
    // Show a lightweight loader while redirecting to prevent a blank screen
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: ds.bg.primary }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: ds.border.primary }}></div>
          <p style={{ color: ds.text.secondary }}>ダッシュボードへ移動しています...</p>
        </div>
      </div>
    );
  }
  
  console.log('✅ User is admin, proceeding with dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: ds.bg.primary }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: ds.border.primary }}></div>
          <p style={{ color: ds.text.secondary }}>キャンペーンデータを読み込み中...</p>
        </div>
      </div>
    );
  }
  console.log('📊 All campaigns loaded:', allCampaigns.length);
  console.log('📊 Campaigns data:', allCampaigns.map(c => ({ 
    id: c.id, 
    name: c.influencerName, 
    price: c.contractedPrice,
    status: c.status,
    dates: {
      plan: c.schedules?.planSubmissionDate,
      draft: c.schedules?.draftSubmissionDate,
      live: c.schedules?.liveDate
    }
  })));
  
  // More visible debugging
  console.log('🔍 ADMIN DASHBOARD DEBUG - Total campaigns:', allCampaigns.length);
  console.log('🔍 ADMIN DASHBOARD DEBUG - Sample campaign:', allCampaigns[0]);
  console.log('🔍 ADMIN DASHBOARD DEBUG - Sample dates:', allCampaigns[0]?.schedules);
  
  const activeCampaigns = allCampaigns.filter(campaign => {
    const raw = (campaign as any).statusDashboard as string | undefined;
    const hasRaw = typeof raw === 'string' && raw.trim().length > 0;
    return hasRaw && !['completed', 'cancelled'].includes(String(campaign.status));
  });

  const totalValue = allCampaigns.reduce((sum, campaign) => {
    const price = campaign.contractedPrice || 0;
    console.log('💰 Campaign price:', { 
      id: campaign.id, 
      price, 
      type: typeof price,
      influencerName: campaign.influencerName 
    });
    
    return sum + price;
  }, 0);
  
  console.log('💰 Total value calculated:', totalValue);
  const pendingApprovals = updates.filter(update => 
    update.requiresAdminAction === true
  ).length;

  

  const hasAnyAction = (updates.some(u => u.requiresAdminAction) || queuedEmailActions.length > 0 || reminderItems.length > 0);

  const uniqueInfluencers = Array.from(
    new Set(allCampaigns.map(campaign => campaign.influencerId))
  ).map(id => {
    const userCampaigns = allCampaigns.filter(c => c.influencerId === id);
    const firstCampaign = userCampaigns[0];
    return {
      id,
      name: firstCampaign?.influencerName || firstCampaign?.title || `User ${id}`,
      avatar: firstCampaign?.influencerAvatar,
      campaigns: userCampaigns
    };
  });


  const sortedUpdates = [...updates].sort((a, b) => {
    // Sort by requiresAdminAction first (true items come first)
    if (a.requiresAdminAction && !b.requiresAdminAction) return -1;
    if (!a.requiresAdminAction && b.requiresAdminAction) return 1;

    // If both have the same action status, sort by timestamp (newest first)
    const aTime = new Date(a.timestamp).getTime();
    const bTime = new Date(b.timestamp).getTime();
    return bTime - aTime;
  });
  const displayedUpdates = showAllUpdates ? sortedUpdates : sortedUpdates.slice(0, 5);
  const hasMoreUpdates = updates.length > 5;

  const formatTimeAgo = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'たった今';
    if (diffInHours < 24) return `${diffInHours}時間前`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}日前`;
  };

  const formatDate = (date: Date | undefined) => {
    if (!date || isNaN(date.getTime())) return '未定';
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    }).format(date);
  };

  const parseAndFormatDate = (dateString: string | null | undefined) => {
    if (!dateString || dateString.trim() === '') return '未定';
    
    try {
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) return '未定';
      
      return formatDate(date);
    } catch (error) {
      console.warn('Invalid date string:', dateString);
      return '未定';
    }
  };

  // Map platform codes to Japanese names
  const mapPlatformToJapanese = (platform: string): string => {
    const platformMap: { [key: string]: string } = {
      // YouTube platforms
      'yt': 'YouTube横動画',
      'youtube_long': 'YouTube横動画',
      'yts': 'YouTube Shorts',
      'youtube_short': 'YouTube Shorts',

      // Social media platforms
      'tw': 'X (Twitter)',
      'x_twitter': 'X (Twitter)',
      'twitter': 'X (Twitter)',

      'ig': 'Instagram',
      'instagram': 'Instagram',

      'tt': 'TikTok',
      'tiktok': 'TikTok',

      // Short video platforms
      'igr': 'Instagram Reels',
      'instagram_reel': 'Instagram Reels',
      'instagram_reels': 'Instagram Reels',

      'sv': 'ショート動画',
      'short_video': 'ショート動画',
      'short_videos': 'ショート動画',

      // Audio platforms
      'pc': 'Podcasts',
      'podcast': 'Podcasts',
      'podcasts': 'Podcasts',

      'vc': 'Voicy',
      'voicy': 'Voicy',

      // Content platforms
      'bl': 'Blog',
      'blog': 'Blog',
    };
    return platformMap[platform] || platform;
  };

  // Map status codes to Japanese names
  const mapStatusToJapanese = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'not_started': '未開始',
      'meeting_scheduling': '打ち合わせ予約中',
      'meeting_scheduled': '打ち合わせ予定',
      'contract_pending': '契約書待ち',
      'trial': 'トライアル中',
      'plan_creating': '構成案作成中',
      'plan_submitted': '構成案確認中',
      'plan_revising': '構成案修正中',
      'draft_creating': '初稿作成中',
      'draft_submitted': '初稿提出済み',
      'draft_revising': '初稿修正中',
      'scheduling': '投稿準備中',
      'scheduled': '投稿済み',
      'payment_processing': '送金手続き中',
      'completed': '完了',
      'cancelled': 'キャンセル'
    };
    return statusMap[status] || status;
  };

  // Handle admin actions on updates
  const handleAdminAction = async (update: Update, action: string) => {
    // For revision actions, show feedback modal
    if (action.includes('revise')) {
      setCurrentRevisionAction({ update, action });
      // Prefill default message for plan revision with submitted link
      let defaultFeedback = '';
      if (update.submissionType === 'plan') {
        const submittedLink = getAbsoluteUrl(update.submissionUrl);
        if (submittedLink) {
          defaultFeedback = `構成案のご提出をありがとうございました！チームで確認しいくつかコメントをさせていただきましたのでご提出いただいたリンクからご確認をよろしくお願いいたします：${submittedLink}`;
        }
      }
      setFeedbackMessage(defaultFeedback);
      setShowFeedbackModal(true);
      return;
    }
    
    // For approval actions, show confirmation dialog
    const actionText = action.includes('approve') ? '承認' : '修正依頼';
    const submissionText = update.submissionType === 'plan' ? '構成案' : '初稿';
    const influencerName = update.influencerName;
    
    const confirmMessage = `${influencerName}さんの${submissionText}を${actionText}しますか？`;
    const isConfirmed = window.confirm(confirmMessage);
    
    if (!isConfirmed) {
      return;
    }
    
    executeAction(update, action);
  };

  // Execute the actual admin action
  const executeAction = async (update: Update, action: string, feedback?: string) => {
    const actionId = `${update.id}_${action}`;
    setProcessingActions(prev => new Set(prev).add(actionId));
    
    try {
      console.log('🔄 Executing admin action:', { update: update.id, action, feedback });
      
      const response = await fetch('/api/admin/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: update.campaignId,
          influencerId: update.influencerId,
          action: action,
          submissionType: update.submissionType,
          feedbackMessage: feedback
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Admin action completed:', result.message);
        
        // Queue a follow-up action (UI-only) to send email notification later
        try {
          const followupType: 'approval' | 'revision' | null = action.includes('approve') ? 'approval' : action.includes('revise') ? 'revision' : null;
          const submissionType = update.submissionType;
          if (followupType && (submissionType === 'plan' || submissionType === 'draft')) {
            const item = {
              campaignId: update.campaignId,
              influencerId: update.influencerId,
              influencerName: update.influencerName,
              submissionType,
              followupType
            };
            const raw = localStorage.getItem('postEmailActions');
            const arr = raw ? JSON.parse(raw) : [];
            const next = Array.isArray(arr) ? [...arr, item] : [item];
            localStorage.setItem('postEmailActions', JSON.stringify(next));
            setQueuedEmailActions(next);
          }
        } catch (e) {
          console.warn('Failed to queue follow-up email action');
        }
        
        // If this is a revision request with feedback, show success modal with mailto link
        if (action.includes('revise') && feedback) {
          // Find the campaign to get the influencer's email
          const campaign = allCampaigns.find(c => c.id === update.campaignId);
          const influencerEmail = campaign?.campaignData?.contact_email || '';
          
          console.log('📧 Found campaign for mailto:', {
            campaignId: update.campaignId,
            campaign: campaign,
            email: influencerEmail,
            campaignData: campaign?.campaignData
          });
          
          setSuccessModalData({
            influencerName: update.influencerName,
            influencerEmail: influencerEmail,
            feedbackMessage: feedback,
            submissionType: update.submissionType === 'plan' ? '構成案' : '初稿'
          });
          setShowSuccessModal(true);
        } else {
          // For other actions, show alert and reload immediately
          alert(result.message);
          window.location.reload();
        }
      } else {
        console.error('❌ Admin action failed:', result.error);
        alert(`エラー: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Admin action error:', error);
      alert('アクションの実行に失敗しました');
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionId);
        return newSet;
      });
    }
  };

  // Handle feedback modal submission
  const handleFeedbackSubmit = () => {
    if (!currentRevisionAction) return;
    
    executeAction(currentRevisionAction.update, currentRevisionAction.action, feedbackMessage);
    setShowFeedbackModal(false);
    setCurrentRevisionAction(null);
    setFeedbackMessage('');
  };

  // Get unique statuses and platforms for filters (filter out empty values)
  const uniqueStatuses = Array.from(
    new Set(
      allCampaigns
        .map(c => (c.status ?? '').toString().trim())
        .filter(s => s.length > 0)
    )
  );
  const uniquePlatforms = Array.from(
    new Set(
      allCampaigns
        .map(c => (c.platform ?? '').toString().trim())
        .filter(p => p.length > 0)
    )
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: ds.bg.primary }}>
      <div className="max-w-7xl mx-auto mobile-padding">
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="font-bold" style={{ 
                  color: ds.text.primary, 
                  fontSize: '32px', 
                  lineHeight: '1.2',
                  fontWeight: 700,
                  letterSpacing: '-0.02em'
                }}>
                  管理者ダッシュボード
                </h1>
                
                {/* Settings Button */}
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center justify-center p-2 rounded-lg transition-all flex-shrink-0`}
                  style={{
                    color: activeTab === 'settings' ? ds.button.primary.bg : ds.text.secondary,
                    backgroundColor: ds.bg.card
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'settings') {
                      e.currentTarget.style.color = ds.text.primary;
                      e.currentTarget.style.backgroundColor = ds.bg.surface;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'settings') {
                      e.currentTarget.style.color = ds.text.secondary;
                      e.currentTarget.style.backgroundColor = ds.bg.card;
                    }
                  }}
                >
                  <Settings className="w-5 h-5" />
                </button>
                
                {/* Refresh Button */}
                <button
                  onClick={refreshData}
                  disabled={isRefreshing}
                  className="flex items-center justify-center p-2 rounded-lg transition-all disabled:opacity-50 flex-shrink-0"
                  style={{ 
                    color: ds.text.secondary,
                    backgroundColor: ds.bg.card
                  }}
                  onMouseEnter={(e) => {
                    if (!isRefreshing) {
                      e.currentTarget.style.color = ds.text.primary;
                      e.currentTarget.style.backgroundColor = ds.bg.surface;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isRefreshing) {
                      e.currentTarget.style.color = ds.text.secondary;
                      e.currentTarget.style.backgroundColor = ds.bg.card;
                    }
                  }}
                >
                  <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              <p className="text-base" style={{ color: ds.text.secondary }}>
                全インフルエンサーキャンペーンの概要と最新の活動状況
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold transition-all`}
            style={{
              backgroundColor: activeTab === 'dashboard' ? ds.bg.surface : ds.button.secondary.bg,
              color: activeTab === 'dashboard' ? ds.text.primary : ds.button.secondary.text,
              boxShadow: activeTab === 'dashboard' ? (ds.isDark ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.06)') : 'none'
            }}
          >
            <Users className="w-4 h-4" />
            <span>ダッシュボード</span>
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold transition-all`}
            style={{
              backgroundColor: activeTab === 'actions' ? ds.bg.surface : ds.button.secondary.bg,
              color: activeTab === 'actions' ? ds.text.primary : ds.button.secondary.text,
              boxShadow: activeTab === 'actions' ? (ds.isDark ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.06)') : 'none'
            }}
          >
            <AlertCircle className="w-4 h-4" />
            <span className="relative inline-flex items-center">
              アクション
              {hasAnyAction && (
                <span className="ml-2 w-2 h-2 rounded-full" style={{ backgroundColor: colors.status.red[500] }}></span>
              )}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('comms')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold transition-all`}
            style={{
              backgroundColor: activeTab === 'comms' ? ds.bg.surface : ds.button.secondary.bg,
              color: activeTab === 'comms' ? ds.text.primary : ds.button.secondary.text,
              boxShadow: activeTab === 'comms' ? (ds.isDark ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.06)') : 'none'
            }}
          >
            <Mail className="w-4 h-4" />
            <span>連絡</span>
          </button>
        </div>

        {activeTab === 'dashboard' ? (
          <div>
            {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="rounded-2xl p-5 sm:p-7 transition-all hover:scale-[1.02]" style={{ 
            backgroundColor: ds.bg.card,
            borderColor: ds.border.primary,
            borderWidth: '1px',
            borderStyle: 'solid',
            boxShadow: ds.isDark ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.06)'
          }}>
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl flex-shrink-0" style={{ backgroundColor: ds.button.primary.bg + '15' }}>
                <TrendingUp size={24} style={{ color: ds.button.primary.bg }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl sm:text-3xl font-semibold mb-1" style={{ color: ds.text.primary, letterSpacing: '-0.01em' }}>
                  {formatAbbreviatedCurrency(totalValue)}
                </p>
                <p className="text-sm font-medium" style={{ color: ds.text.secondary }}>総契約額</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-5 sm:p-7 transition-all hover:scale-[1.02]" style={{ 
            backgroundColor: ds.bg.card,
            borderColor: ds.border.primary,
            borderWidth: '1px',
            borderStyle: 'solid',
            boxShadow: ds.isDark ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.06)'
          }}>
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl flex-shrink-0" style={{ backgroundColor: '#3b82f6' + '15' }}>
                <Users size={24} style={{ color: '#3b82f6' }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl sm:text-3xl font-semibold mb-1" style={{ color: ds.text.primary, letterSpacing: '-0.01em' }}>
                  {allCampaigns.length}
                </p>
                <p className="text-sm font-medium" style={{ color: ds.text.secondary }}>キャンペーン数</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-5 sm:p-7 transition-all hover:scale-[1.02]" style={{ 
            backgroundColor: ds.bg.card,
            borderColor: ds.border.primary,
            borderWidth: '1px',
            borderStyle: 'solid',
            boxShadow: ds.isDark ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.06)'
          }}>
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl flex-shrink-0" style={{ backgroundColor: '#f97316' + '15' }}>
                <Clock size={24} style={{ color: '#f97316' }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl sm:text-3xl font-semibold mb-1" style={{ color: ds.text.primary, letterSpacing: '-0.01em' }}>
                  {activeCampaigns.length}
                </p>
                <p className="text-sm font-medium" style={{ color: ds.text.secondary }}>進行中</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-5 sm:p-7 transition-all hover:scale-[1.02]" style={{ 
            backgroundColor: ds.bg.card,
            borderColor: ds.border.primary,
            borderWidth: '1px',
            borderStyle: 'solid',
            boxShadow: ds.isDark ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.06)'
          }}>
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl flex-shrink-0" style={{ backgroundColor: '#ef4444' + '15' }}>
                <AlertCircle size={24} style={{ color: '#ef4444' }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl sm:text-3xl font-semibold mb-1" style={{ color: ds.text.primary, letterSpacing: '-0.01em' }}>
                  {pendingApprovals}
                </p>
                <p className="text-sm font-medium" style={{ color: ds.text.secondary }}>要確認</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full">
            {/* Latest Updates */}
            <div className="rounded-2xl p-5 sm:p-7 mb-8" style={{ 
              backgroundColor: ds.bg.card,
              borderColor: ds.border.primary,
              borderWidth: '1px',
              borderStyle: 'solid',
              boxShadow: ds.isDark ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.06)'
            }}>
              <h3 className="font-semibold mb-5" style={{ color: ds.text.primary, fontSize: '20px', lineHeight: '1.3' }}>
                アップデート
              </h3>
              <div className="space-y-2">
                {displayedUpdates.map((update: Update) => (
                  <div key={update.id} className="rounded-lg p-3 transition-colors" style={{ 
                    backgroundColor: update.requiresAdminAction ? ds.bg.surface : ds.bg.card
                  }}>
                    <div className="flex items-center justify-between">
                      {/* Left side - Message and timestamp */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            update.requiresAdminAction ? 'animate-pulse' : ''
                          }`} style={{ 
                            backgroundColor: update.requiresAdminAction ? '#ef4444' : ds.text.secondary 
                          }}></div>
                          <p className="text-sm truncate" style={{ color: ds.text.primary }}>
                            {update.message}
                          </p>
                          <span className="text-xs whitespace-nowrap" style={{ color: ds.text.secondary }}>
                            {formatTimeAgo(update.timestamp)}
                          </span>
                        </div>
                      </div>

                      {/* Right side - Actions */}
                      {update.requiresAdminAction ? (
                        <div className="flex items-center space-x-2 ml-3">
                          {/* Review Link */}
                          {update.submissionUrl && (
                            <a
                              href={getAbsoluteUrl(update.submissionUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-xs px-2 py-1 rounded transition-colors"
                              style={{ 
                                backgroundColor: ds.button.secondary.bg,
                                color: ds.button.secondary.text
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.hover}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.bg}
                            >
                              <ExternalLink size={10} />
                              <span>確認</span>
                            </a>
                          )}
                          
                          {/* Action Buttons */}
                          <button
                            onClick={() => handleAdminAction(update,
                              update.submissionType === 'plan' ? 'approve_plan' : 'approve_draft'
                            )}
                            disabled={processingActions.has(`${update.id}_${update.submissionType === 'plan' ? 'approve_plan' : 'approve_draft'}`)}
                            className="inline-flex items-center space-x-1 text-xs px-2 py-1 rounded transition-colors disabled:opacity-50"
                            style={{ 
                              backgroundColor: '#10b981',
                              color: 'white'
                            }}
                          >
                            {processingActions.has(`${update.id}_${update.actionType}`) ? (
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Check size={10} />
                            )}
                            <span>承認</span>
                          </button>
                          
                          <button
                            onClick={() => handleAdminAction(update, 
                              update.submissionType === 'plan' ? 'revise_plan' : 'revise_draft'
                            )}
                            disabled={processingActions.has(`${update.id}_${update.submissionType === 'plan' ? 'revise_plan' : 'revise_draft'}`)}
                            className="inline-flex items-center space-x-1 text-xs px-2 py-1 rounded transition-colors disabled:opacity-50"
                            style={{ 
                              backgroundColor: '#f59e0b',
                              color: 'white'
                            }}
                          >
                            {processingActions.has(`${update.id}_${update.submissionType === 'plan' ? 'revise_plan' : 'revise_draft'}`) ? (
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <X size={10} />
                            )}
                            <span>修正</span>
                          </button>
                        </div>
                      ) : (
                        // For non-action updates, still show a link if present (e.g., posted content)
                        update.submissionUrl ? (
                          <div className="flex items-center space-x-2 ml-3">
                            <a
                              href={getAbsoluteUrl(update.submissionUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-xs px-2 py-1 rounded transition-colors"
                              style={{ 
                                backgroundColor: ds.button.secondary.bg,
                                color: ds.button.secondary.text
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.hover}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.bg}
                            >
                              <ExternalLink size={10} />
                              <span>{update.submissionType === 'content' ? '投稿を見る' : 'リンク'}</span>
                            </a>
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Show More Button */}
                {hasMoreUpdates && !showAllUpdates && (
                  <div className="text-center pt-4">
                    <button
                      onClick={() => setShowAllUpdates(true)}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        backgroundColor: ds.button.secondary.bg,
                        color: ds.button.secondary.text,
                        borderColor: ds.border.primary,
                        borderWidth: '1px',
                        borderStyle: 'solid'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.hover}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.bg}
                    >
                      もっと見る ({updates.length - 5}件)
                    </button>
                  </div>
                )}
                
                {/* Show Less Button */}
                {showAllUpdates && hasMoreUpdates && (
                  <div className="text-center pt-4">
                    <button
                      onClick={() => setShowAllUpdates(false)}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        backgroundColor: ds.button.secondary.bg,
                        color: ds.button.secondary.text,
                        borderColor: ds.border.primary,
                        borderWidth: '1px',
                        borderStyle: 'solid'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.hover}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.bg}
                    >
                      閉じる
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Campaigns Table */}
            <div className="rounded-2xl p-5 sm:p-7" style={{ 
              backgroundColor: ds.bg.card,
              borderColor: ds.border.primary,
              borderWidth: '1px',
              borderStyle: 'solid',
              boxShadow: ds.isDark ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.06)'
            }}>
              <h2 className="font-semibold mb-6" style={{ color: ds.text.primary, fontSize: '20px', lineHeight: '1.3' }}>
                キャンペーン一覧 ({filteredCampaigns.length})
              </h2>
              
              {/* Search and Filters */}
              <div className="mb-6">
                <div className="flex flex-col gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={16} style={{ color: ds.text.secondary }} />
                      <input
                        type="text"
                        placeholder="インフルエンサー名またはキャンペーン名で検索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 transition-all"
                        style={{ 
                          backgroundColor: ds.form.input.bg,
                          borderColor: ds.form.input.border,
                          color: ds.text.primary,
                          borderWidth: '1px',
                          borderStyle: 'solid'
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Status Filter */}
                    <div className="flex items-center space-x-2">
                      <Filter size={16} className="flex-shrink-0" style={{ color: ds.text.secondary }} />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 transition-all"
                        style={{ 
                          backgroundColor: ds.form.input.bg,
                          borderColor: ds.form.input.border,
                          color: ds.text.primary,
                          borderWidth: '1px',
                          borderStyle: 'solid'
                        }}
                      >
                        <option value="all">📊 全てのステータス</option>
                        <option value="ongoing">🟢 進行中</option>
                        <option value="action_required">🔴 アクション必要</option>
                        {uniqueStatuses.map(status => (
                          <option key={status} value={status}>
                            {(() => {
                              const statusIcons: Record<string, string> = {
                                'not_started': '⚪',
                                'meeting_scheduling': '📅',
                                'meeting_scheduled': '📅',
                                'plan_creating': '✏️',
                                'plan_submitted': '📋',
                                'plan_revising': '✏️',
                                'draft_creating': '📝',
                                'draft_submitted': '📄',
                                'draft_revising': '✏️',
                                'scheduling': '📱',
                                'scheduled': '🚀',
                                'payment_processing': '💰',
                                'completed': '✅',
                                'cancelled': '❌'
                              };
                              return `${statusIcons[status] || '📊'} ${mapStatusToJapanese(status)}`;
                            })()}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Platform Filter */}
                    <div className="flex items-center space-x-2">
                      <Tag size={16} className="flex-shrink-0" style={{ color: ds.text.secondary }} />
                      <select
                        value={platformFilter}
                        onChange={(e) => setPlatformFilter(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 transition-all"
                        style={{ 
                          backgroundColor: ds.form.input.bg,
                          borderColor: ds.form.input.border,
                          color: ds.text.primary,
                          borderWidth: '1px',
                          borderStyle: 'solid'
                        }}
                      >
                        <option value="all">🌐 全てのプラットフォーム</option>
                        {uniquePlatforms.map(platform => (
                          <option key={platform} value={platform}>
                            {(() => {
                              const platformIcons: Record<string, string> = {
                                // YouTube platforms
                                'yt': '🎥',
                                'youtube_long': '🎥',
                                'yts': '📱',
                                'youtube_short': '📱',

                                // Social media platforms
                                'tw': '🐦',
                                'x_twitter': '🐦',
                                'twitter': '🐦',

                                'ig': '📸',
                                'instagram': '📸',

                                'tt': '🎵',
                                'tiktok': '🎵',

                                // Short video platforms
                                'igr': '📹',
                                'instagram_reel': '📹',
                                'instagram_reels': '📹',

                                'sv': '📱',
                                'short_video': '📱',
                                'short_videos': '📱',

                                // Audio platforms
                                'pc': '🎙️',
                                'podcast': '🎙️',
                                'podcasts': '🎙️',

                                'vc': '🎧',
                                'voicy': '🎧',

                                // Content platforms
                                'bl': '✍️',
                                'blog': '✍️',
                              };
                              return `${platformIcons[platform] || '🌐'} ${mapPlatformToJapanese(platform)}`;
                            })()}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="rounded-xl overflow-hidden isolate" style={{ 
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
                  onWheel={(e) => {
                    e.stopPropagation();
                    const container = e.currentTarget;
                    const scrollTop = container.scrollTop;
                    const scrollHeight = container.scrollHeight;
                    const clientHeight = container.clientHeight;
                    
                    // Only prevent default if we're not at the top or bottom
                    if ((scrollTop > 0 && e.deltaY < 0) || 
                        (scrollTop < scrollHeight - clientHeight && e.deltaY > 0)) {
                      e.preventDefault();
                    }
                  }}
                >
                  <div className="overflow-x-auto">
                    <div className="min-w-full inline-block align-middle">
                      <table className="min-w-full border-separate" style={{ borderColor: ds.border.secondary, borderSpacing: 0 }}>
                        <thead className="sticky top-0 z-10" style={{ backgroundColor: ds.bg.surface + '80' }}>
                          <tr className="h-16" style={{ 
                            backgroundColor: ds.bg.surface + '80',
                            borderBottomColor: ds.border.primary,
                            borderBottomWidth: '1px',
                            borderBottomStyle: 'solid'
                          }}>
                            <th className="text-left py-3 px-4 text-sm font-medium whitespace-nowrap min-w-[200px] h-16 align-middle sticky -top-px z-10" style={{ color: ds.text.secondary, backgroundColor: ds.bg.surface + '80' }}>
                              インフルエンサー
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium whitespace-nowrap min-w-[120px] h-16 align-middle sticky -top-px z-10" style={{ color: ds.text.secondary, backgroundColor: ds.bg.surface + '80' }}>
                              プラットフォーム
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium whitespace-nowrap min-w-[140px] h-16 align-middle sticky -top-px z-10" style={{ color: ds.text.secondary, backgroundColor: ds.bg.surface + '80' }}>
                              ステータス
                            </th>
                            <th 
                              className="text-left py-3 px-4 text-sm font-medium whitespace-nowrap min-w-[120px] h-16 align-middle cursor-pointer transition-colors sticky -top-px z-10"
                              style={{ 
                                color: ds.text.secondary,
                                backgroundColor: ds.bg.surface + '80'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.bg.surface + '50'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              onClick={() => handleSort('contractedPrice')}
                            >
                              <div className="flex items-center justify-between">
                                報酬額
                                <div className="flex flex-col ml-1">
                                  <ChevronUp 
                                    size={12} 
                                    style={{ color: sortField === 'contractedPrice' && sortDirection === 'asc' ? ds.text.accent : ds.text.secondary + '30' }}
                                  />
                                  <ChevronDown 
                                    size={12} 
                                    style={{ color: sortField === 'contractedPrice' && sortDirection === 'desc' ? ds.text.accent : ds.text.secondary + '30' }}
                                  />
                                </div>
                              </div>
                            </th>
                            <th 
                              className="text-left py-3 px-4 text-sm font-medium whitespace-nowrap min-w-[140px] h-16 align-middle cursor-pointer transition-colors sticky -top-px z-10"
                              style={{ 
                                color: ds.text.secondary,
                                backgroundColor: ds.bg.surface + '80'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.bg.surface + '50'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              onClick={() => handleSort('planSubmissionDate')}
                            >
                              <div className="flex items-center justify-between">
                                構成案提出日
                                <div className="flex flex-col ml-1">
                                  <ChevronUp 
                                    size={12} 
                                    style={{ color: sortField === 'planSubmissionDate' && sortDirection === 'asc' ? ds.text.accent : ds.text.secondary + '30' }}
                                  />
                                  <ChevronDown 
                                    size={12} 
                                    style={{ color: sortField === 'planSubmissionDate' && sortDirection === 'desc' ? ds.text.accent : ds.text.secondary + '30' }}
                                  />
                                </div>
                              </div>
                            </th>
                            <th 
                              className="text-left py-3 px-4 text-sm font-medium whitespace-nowrap min-w-[140px] h-16 align-middle cursor-pointer transition-colors sticky -top-px z-10"
                              style={{ 
                                color: ds.text.secondary,
                                backgroundColor: ds.bg.surface + '80'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.bg.surface + '50'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              onClick={() => handleSort('draftSubmissionDate')}
                            >
                              <div className="flex items-center justify-between">
                                初稿提出日
                                <div className="flex flex-col ml-1">
                                  <ChevronUp 
                                    size={12} 
                                    style={{ color: sortField === 'draftSubmissionDate' && sortDirection === 'asc' ? ds.text.accent : ds.text.secondary + '30' }}
                                  />
                                  <ChevronDown 
                                    size={12} 
                                    style={{ color: sortField === 'draftSubmissionDate' && sortDirection === 'desc' ? ds.text.accent : ds.text.secondary + '30' }}
                                  />
                                </div>
                              </div>
                            </th>
                            <th 
                              className="text-left py-3 px-4 text-sm font-medium whitespace-nowrap min-w-[120px] h-16 align-middle cursor-pointer transition-colors sticky -top-px z-10"
                              style={{ 
                                color: ds.text.secondary,
                                backgroundColor: ds.bg.surface + '80'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.bg.surface + '50'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              onClick={() => handleSort('liveDate')}
                            >
                              <div className="flex items-center justify-between">
                                投稿日
                                <div className="flex flex-col ml-1">
                                  <ChevronUp 
                                    size={12} 
                                    style={{ color: sortField === 'liveDate' && sortDirection === 'asc' ? ds.text.accent : ds.text.secondary + '30' }}
                                  />
                                  <ChevronDown 
                                    size={12} 
                                    style={{ color: sortField === 'liveDate' && sortDirection === 'desc' ? ds.text.accent : ds.text.secondary + '30' }}
                                  />
                                </div>
                              </div>
                            </th>
                            <th 
                              className="text-left py-3 px-4 text-sm font-medium whitespace-nowrap min-w-[120px] h-16 align-middle cursor-pointer transition-colors sticky -top-px z-10"
                              style={{ 
                                color: ds.text.secondary,
                                backgroundColor: ds.bg.surface + '80'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.bg.surface + '50'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              onClick={() => handleSort('updatedAt')}
                            >
                              <div className="flex items-center justify-between">
                                更新日
                                <div className="flex flex-col ml-1">
                                  <ChevronUp 
                                    size={12} 
                                    style={{ color: sortField === 'updatedAt' && sortDirection === 'asc' ? ds.text.accent : ds.text.secondary + '30' }}
                                  />
                                  <ChevronDown 
                                    size={12} 
                                    style={{ color: sortField === 'updatedAt' && sortDirection === 'desc' ? ds.text.accent : ds.text.secondary + '30' }}
                                  />
                                </div>
                              </div>
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium whitespace-nowrap min-w-[100px] h-16 align-middle sticky -top-px z-10" style={{ color: ds.text.secondary, backgroundColor: ds.bg.surface + '80' }}>
                              構成案リンク
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium whitespace-nowrap min-w-[100px] h-16 align-middle sticky -top-px z-10" style={{ color: ds.text.secondary, backgroundColor: ds.bg.surface + '80' }}>
                              初稿リンク
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium whitespace-nowrap min-w-[100px] h-16 align-middle sticky -top-px z-10" style={{ color: ds.text.secondary, backgroundColor: ds.bg.surface + '80' }}>
                              PRリンク
                            </th>
                          </tr>
                        </thead>
                        <tbody style={{ backgroundColor: ds.bg.primary }}>
                          {filteredCampaigns.map(campaign => (
                            <tr 
                              key={campaign.id} 
                              className="transition-colors h-16" 
                              style={{
                                borderBottomColor: ds.border.secondary + '30',
                                borderBottomWidth: '1px',
                                borderBottomStyle: 'solid'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.bg.surface + '30'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <td className="py-3 px-4 h-16">
                                <div className="flex items-center space-x-3 h-full">
                                  {campaign.influencerAvatar ? (
                                    <img
                                      src={campaign.influencerAvatar}
                                      alt={campaign.influencerName || campaign.title}
                                      className="w-8 h-8 rounded-full"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: ds.button.primary.bg }}>
                                      <User size={14} style={{ color: ds.button.primary.text }} />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate" style={{ color: ds.text.primary }}>
                                      {campaign.influencerName || campaign.title || `Campaign ${campaign.id}`}
                                    </p>
                                    <p className="text-xs truncate" style={{ color: ds.text.secondary }}>
                                      {campaign.title}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 h-16">
                                <div className="flex items-center h-full">
                                  <span className="text-sm truncate" style={{ color: ds.text.secondary }}>
                                    {campaign.platform && campaign.platform.trim() ? mapPlatformToJapanese(campaign.platform) : '未設定'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 h-16">
                                <div className="flex items-center h-full">
                                  <div className="flex items-center space-x-2">
                                    {(() => {
                                      const raw = (campaign as any).statusDashboard as string | undefined;
                                      const hasRaw = typeof raw === 'string' && raw.trim().length > 0;
                                      const displayStatus = hasRaw ? campaign.status : 'completed';
                                      
                                      return (
                                        <>
                                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                            ['plan_submitted', 'draft_submitted'].includes(displayStatus) ? 'bg-red-400' :
                                            !['completed', 'cancelled'].includes(displayStatus) ? 'bg-green-400' :
                                            'bg-gray-400'
                                          }`}></div>
                                          <span className="text-sm truncate" style={{ color: ds.text.secondary }}>
                                            {mapStatusToJapanese(displayStatus)}
                                          </span>
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 h-16">
                                <div className="flex items-center h-full">
                                  <span className="text-sm truncate" style={{ color: ds.text.primary }}>
                                    {formatAbbreviatedCurrency(campaign.contractedPrice || 0)}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 h-16">
                                <div className="flex items-center h-full">
                                  <span className="text-sm truncate" style={{ color: ds.text.secondary }}>
                                    {parseAndFormatDate(campaign.schedules?.planSubmissionDate)}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 h-16">
                                <div className="flex items-center h-full">
                                  <span className="text-sm truncate" style={{ color: ds.text.secondary }}>
                                    {parseAndFormatDate(campaign.schedules?.draftSubmissionDate)}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 h-16">
                                <div className="flex items-center h-full">
                                  <span className="text-sm truncate" style={{ color: ds.text.secondary }}>
                                    {parseAndFormatDate(campaign.schedules?.liveDate)}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 h-16">
                                <div className="flex items-center h-full">
                                  <span className="text-sm truncate" style={{ color: ds.text.secondary }}>
                                    {(() => {
                                      // Only use Google Sheets date_status_updated; no fallback
                                      const rawDate = campaign.campaignData?.date_status_updated;
                                      if (!rawDate || rawDate === '' || rawDate === 'undefined') {
                                        return '-';
                                      }
                                      return parseAndFormatDate(rawDate);
                                    })()}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 h-16">
                                <div className="flex items-center h-full">
                                  {campaign.campaignData?.url_plan ? (
                                    <a
                                      href={campaign.campaignData.url_plan}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-500 hover:text-blue-700 underline"
                                    >
                                      リンク
                                    </a>
                                  ) : (
                                    <span className="text-sm" style={{ color: ds.text.secondary }}>-</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 h-16">
                                <div className="flex items-center h-full">
                                  {campaign.campaignData?.url_draft ? (
                                    <a
                                      href={campaign.campaignData.url_draft}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-500 hover:text-blue-700 underline"
                                    >
                                      リンク
                                    </a>
                                  ) : (
                                    <span className="text-sm" style={{ color: ds.text.secondary }}>-</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 h-16">
                                <div className="flex items-center h-full">
                                  {campaign.campaignData?.url_content ? (
                                    <a
                                      href={campaign.campaignData.url_content}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-500 hover:text-blue-700 underline"
                                    >
                                      リンク
                                    </a>
                                  ) : (
                                    <span className="text-sm" style={{ color: ds.text.secondary }}>-</span>
                                  )}
                                </div>
                              </td>
                          </tr>
                        ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              
              {filteredCampaigns.length === 0 && (
                <div className="text-center py-8" style={{ color: ds.text.secondary }}>
                  検索条件に一致するキャンペーンが見つかりません
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Links Card - Moved to bottom */}
        <div className="rounded-xl p-4 sm:p-6 mt-6" style={{ 
          backgroundColor: ds.bg.card,
          borderColor: ds.border.primary,
          borderWidth: '1px',
          borderStyle: 'solid'
        }}>
          <h3 className="font-semibold mb-4" style={{ color: ds.text.primary, fontSize: ds.typography.heading.h3.fontSize, lineHeight: ds.typography.heading.h3.lineHeight }}>
            リンク
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ds.text.accent }} />
              <a
                href="https://usespeak.notion.site/YouTube-4-0-5b88f1ad34ed45f3aaeca324af039665?source=copy_link"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: ds.text.accent, textDecoration: 'underline' }}
              >
                ガイドライン（YouTube長編）
              </a>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ds.text.accent }} />
              <a
                href="https://usespeak.notion.site/1b3792ec2f10800f9f94e476a87c06f1?source=copy_link"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: ds.text.accent, textDecoration: 'underline' }}
              >
                ガイドライン（ショート動画）
              </a>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ds.text.accent }} />
              <a
                href="https://usespeak.notion.site/Podcast-224792ec2f1080f2a7d5fce804ce4b93?source=copy_link"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: ds.text.accent, textDecoration: 'underline' }}
              >
                ガイドライン（ポッドキャスト）
              </a>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ds.text.accent }} />
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
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ds.text.accent }} />
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
        ) : activeTab === 'actions' ? (
          <div className="space-y-6">
            {/* 承認待ちの申請 */}
            {pendingRequests.length > 0 && (
              <div className="rounded-lg p-4 sm:p-5" style={{ 
                backgroundColor: ds.bg.card,
                borderColor: ds.border.primary,
                borderWidth: '1px',
                borderStyle: 'solid'
              }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: '#fef3c7' }}>
                    <AlertCircle size={12} style={{ color: '#f59e0b' }} />
                  </div>
                  <h3 className="font-medium" style={{ 
                    color: ds.text.primary, 
                    fontSize: `${ds.typography.heading.h3.fontSize}px`,
                    lineHeight: ds.typography.heading.h3.lineHeight,
                    fontWeight: ds.typography.heading.h3.fontWeight
                  }}>
                    承認待ちの申請 ({pendingRequests.length}件)
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {pendingRequests.map(request => {
                    const getRequestTypeLabel = (type: string) => {
                      switch (type) {
                        case 'plan_date_change': return '構成案提出日変更';
                        case 'draft_date_change': return '初稿提出日変更';
                        case 'live_date_change': return '投稿日変更';
                        default: return '変更申請';
                      }
                    };

                    return (
                      <div key={request.id} className="p-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#f59e0b' }}></div>
                              <p className="font-medium truncate" style={{ 
                                color: ds.text.primary,
                                fontSize: `${ds.typography.text.sm.fontSize}px`,
                                lineHeight: ds.typography.text.sm.lineHeight
                              }}>
                                {request.influencerName}
                              </p>
                              <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ 
                                backgroundColor: '#fef3c7',
                                color: '#92400e'
                              }}>
                                {getRequestTypeLabel(request.type)}
                              </span>
                            </div>
                            <p className="text-xs mb-0.5" style={{ color: ds.text.secondary }}>
                              {request.description}
                            </p>
                            {request.requestedChanges.map((change, idx) => (
                              <p key={idx} className="text-xs" style={{ color: ds.text.accent }}>
                                {change.currentValue && `${change.currentValue} → `}{change.newValue}
                              </p>
                            ))}
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={async () => {
                                if (!user) return;
                                const comment = prompt('承認コメント（任意）:');
                                if (comment === null) return;
                                
                                setProcessingActions(prev => new Set(prev).add(request.id));
                                try {
                                  const response = await fetch('/api/requests', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      requestId: request.id,
                                      status: 'approved',
                                      adminId: user.id,
                                      adminName: user.name,
                                      comment: comment || '承認されました',
                                    }),
                                  });

                                  if (response.ok) {
                                    alert('申請を承認しました');
                                    refreshData();
                                  } else {
                                    const errorData = await response.json().catch(() => ({}));
                                    console.error('申請処理エラー:', errorData);
                                    alert(`申請の処理に失敗しました: ${errorData.details || errorData.error || '不明なエラー'}`);
                                  }
                                } catch (error) {
                                  console.error('Error approving request:', error);
                                  alert('エラーが発生しました');
                                } finally {
                                  setProcessingActions(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(request.id);
                                    return newSet;
                                  });
                                }
                              }}
                              disabled={processingActions.has(request.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50"
                              style={{ backgroundColor: colors.status.emerald[500], color: 'white' }}
                              onMouseEnter={(e) => !processingActions.has(request.id) && (e.currentTarget.style.backgroundColor = colors.status.emerald[600])}
                              onMouseLeave={(e) => !processingActions.has(request.id) && (e.currentTarget.style.backgroundColor = colors.status.emerald[500])}
                            >
                              <Check size={12} />
                              承認
                            </button>
                            <button
                              onClick={async () => {
                                if (!user) return;
                                const comment = prompt('却下理由:');
                                if (!comment) return;
                                
                                setProcessingActions(prev => new Set(prev).add(request.id));
                                try {
                                  const response = await fetch('/api/requests', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      requestId: request.id,
                                      status: 'rejected',
                                      adminId: user.id,
                                      adminName: user.name,
                                      comment,
                                    }),
                                  });

                                  if (response.ok) {
                                    alert('申請を却下しました');
                                    refreshData();
                                  } else {
                                    const errorData = await response.json().catch(() => ({}));
                                    console.error('申請処理エラー:', errorData);
                                    alert(`申請の処理に失敗しました: ${errorData.details || errorData.error || '不明なエラー'}`);
                                  }
                                } catch (error) {
                                  console.error('Error rejecting request:', error);
                                  alert('エラーが発生しました');
                                } finally {
                                  setProcessingActions(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(request.id);
                                    return newSet;
                                  });
                                }
                              }}
                              disabled={processingActions.has(request.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50"
                              style={{ backgroundColor: colors.status.orange[500], color: 'white' }}
                              onMouseEnter={(e) => !processingActions.has(request.id) && (e.currentTarget.style.backgroundColor = colors.status.orange[600])}
                              onMouseLeave={(e) => !processingActions.has(request.id) && (e.currentTarget.style.backgroundColor = colors.status.orange[500])}
                            >
                              <X size={12} />
                              却下
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 要対応の提出物 */}
            <div className="rounded-lg p-4 sm:p-5" style={{ 
              backgroundColor: ds.bg.card,
              borderColor: ds.border.primary,
              borderWidth: '1px',
              borderStyle: 'solid'
            }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: colors.status.red.bg }}>
                  <AlertCircle size={12} style={{ color: colors.status.red[500] }} />
                </div>
                <h3 className="font-medium" style={{ 
                  color: ds.text.primary, 
                  fontSize: `${ds.typography.heading.h3.fontSize}px`,
                  lineHeight: ds.typography.heading.h3.lineHeight,
                  fontWeight: ds.typography.heading.h3.fontWeight
                }}>
                  要対応の提出物
                </h3>
              </div>
              
              <div className="space-y-3">
                {updates.filter(u => u.requiresAdminAction).length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: ds.bg.surface }}>
                      <Check size={16} style={{ color: ds.text.secondary }} />
                    </div>
                    <p className="font-medium mb-1" style={{ 
                      color: ds.text.primary,
                      fontSize: `${ds.typography.text.sm.fontSize}px`,
                      lineHeight: ds.typography.text.sm.lineHeight
                    }}>すべて完了しました</p>
                    <p style={{ 
                      color: ds.text.secondary,
                      fontSize: `${ds.typography.text.sm.fontSize}px`,
                      lineHeight: ds.typography.text.sm.lineHeight
                    }}>現在対応が必要な提出物はありません。</p>
                  </div>
                ) : (
                  updates.filter(u => u.requiresAdminAction).map(u => (
                    <div key={u.id} className="p-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: colors.status.red[400] }}></div>
                            <p className="font-medium truncate" style={{ 
                              color: ds.text.primary,
                              fontSize: `${ds.typography.text.sm.fontSize}px`,
                              lineHeight: ds.typography.text.sm.lineHeight
                            }}>
                              {u.influencerName}
                            </p>
                            <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ 
                              backgroundColor: colors.status.red.bg,
                              color: colors.status.red[500]
                            }}>
                              {u.submissionType === 'plan' ? '構成案' : u.submissionType === 'draft' ? '初稿' : '提出物'}
                            </span>
                          </div>
                          <p className="text-xs mb-0.5" style={{ color: ds.text.secondary }}>
                            {u.message.replace(`${u.influencerName}さんから`, '').replace(`${u.influencerName}さんの`, '')}
                          </p>
                          <p className="text-xs" style={{ color: ds.text.secondary }}>{formatTimeAgo(u.timestamp)}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {u.submissionUrl && (
                            <a
                              href={getAbsoluteUrl(u.submissionUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
                              style={{ 
                                backgroundColor: ds.button.secondary.bg, 
                                color: ds.button.secondary.text,
                                borderColor: ds.border.primary,
                                borderWidth: '1px',
                                borderStyle: 'solid'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.hover}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.bg}
                            >
                              <ExternalLink size={12} />
                              確認
                            </a>
                          )}
                          <button
                            onClick={() => handleAdminAction(u, u.submissionType === 'plan' ? 'approve_plan' : 'approve_draft')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                            style={{ backgroundColor: colors.status.emerald[500], color: 'white' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.status.emerald[600]}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.status.emerald[500]}
                          >
                            <Check size={12} />
                            承認
                          </button>
                          <button
                            onClick={() => handleAdminAction(u, u.submissionType === 'plan' ? 'revise_plan' : 'revise_draft')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                            style={{ backgroundColor: colors.status.orange[500], color: 'white' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.status.orange[600]}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.status.orange[500]}
                          >
                            <X size={12} />
                            修正依頼
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
              {(() => {
                const now = new Date();
                const msPerDay = 1000 * 60 * 60 * 24;

                const daysSinceStatusUpdated = (campaign: Campaign) => {
                  const updatedRaw = campaign.campaignData?.date_status_updated || campaign.updatedAt?.toString();
                  if (!updatedRaw) return null;
                  const updatedAt = new Date(updatedRaw);
                  if (isNaN(updatedAt.getTime())) return null;
                  return Math.floor((now.getTime() - updatedAt.getTime()) / msPerDay);
                };

                const daysUntilDeadline = (dateString: string | null | undefined) => {
                  if (!dateString || String(dateString).trim() === '') return null;
                  const due = new Date(String(dateString));
                  if (isNaN(due.getTime())) return null;
                  return Math.ceil((due.getTime() - now.getTime()) / msPerDay);
                };

                const getRelevantDeadline = (campaign: Campaign): { days: number | null; type: string; label: string } => {
                  const status = String(campaign.status || '');
                  
                  // Check plan deadline for plan-related statuses
                  if (['plan_creating', 'plan_submitted', 'plan_revising'].includes(status)) {
                    const days = daysUntilDeadline(campaign.schedules?.planSubmissionDate);
                    return { days, type: 'plan', label: '構成案提出期限' };
                  }
                  
                  // Check draft deadline for draft-related statuses
                  if (['draft_creating', 'draft_submitted', 'draft_revising'].includes(status)) {
                    const days = daysUntilDeadline(campaign.schedules?.draftSubmissionDate);
                    return { days, type: 'draft', label: '初稿提出期限' };
                  }
                  
                  // Check live date for scheduling/posting statuses
                  if (['scheduling', 'scheduled'].includes(status)) {
                    const days = daysUntilDeadline(campaign.schedules?.liveDate);
                    return { days, type: 'live', label: '投稿予定日' };
                  }
                  
                  // For other statuses, check draft deadline (most common)
                  const days = daysUntilDeadline(campaign.schedules?.draftSubmissionDate);
                  return { days, type: 'draft', label: '初稿提出期限' };
                };

                type ActionItem = { campaign: Campaign; kind: 'trial' | 'meeting' | 'overdue'; reason: string };
                const items: ActionItem[] = [];

                for (const c of allCampaigns) {
                  const status = String(c.status || '');
                  const since = daysSinceStatusUpdated(c);
                  const deadline = getRelevantDeadline(c);
                  const untilDeadline = deadline.days;

                  // Rule 1: trial > 3 days AND draft due in < 10 days
                  if (status === 'trial' && since !== null && since > 3 && untilDeadline !== null && untilDeadline > 0 && untilDeadline < 10) {
                    items.push({
                      campaign: c,
                      kind: 'trial',
                      reason: 'トライアルリマインダー'
                    });
                  }

                  // Rule 2: meeting_scheduling for last 3 days AND draft due in < 30 days
                  if (status === 'meeting_scheduling' && since !== null && since >= 3 && untilDeadline !== null && untilDeadline > 0 && untilDeadline < 30) {
                    items.push({
                      campaign: c,
                      kind: 'meeting',
                      reason: '打ち合わせリマインダー'
                    });
                  }

                  // Rule 3: Overdue campaigns - deadline has passed but not yet completed
                  if (untilDeadline !== null && untilDeadline < 0 && !['completed', 'cancelled'].includes(status)) {
                    const daysOverdue = Math.abs(untilDeadline);
                    items.push({
                      campaign: c,
                      kind: 'overdue',
                      reason: `${deadline.label}超過 (${daysOverdue}日遅れ)`
                    });
                  }
                }

                const formatDateString = (raw?: string | null): string => {
                  if (!raw || String(raw).trim() === '') return '';
                  const d = new Date(String(raw));
                  if (isNaN(d.getTime())) return '';
                  return new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' }).format(d);
                };

                const getDeadlineInfo = (campaign: Campaign): { type: 'plan' | 'draft' | 'live'; label: string; date: string } | null => {
                  const status = String(campaign.status || '');
                  if (['plan_creating', 'plan_submitted', 'plan_revising'].includes(status)) {
                    return { type: 'plan', label: '構成案提出期限', date: formatDateString(campaign.schedules?.planSubmissionDate || null) };
                  }
                  if (['draft_creating', 'draft_submitted', 'draft_revising'].includes(status)) {
                    return { type: 'draft', label: '初稿提出期限', date: formatDateString(campaign.schedules?.draftSubmissionDate || null) };
                  }
                  if (['scheduling', 'scheduled'].includes(status)) {
                    return { type: 'live', label: '投稿予定日', date: formatDateString(campaign.schedules?.liveDate || null) };
                  }
                  // fallback to draft
                  return { type: 'draft', label: '初稿提出期限', date: formatDateString(campaign.schedules?.draftSubmissionDate || null) };
                };

                const buildEmail = (campaign: Campaign, kind: 'trial' | 'meeting' | 'overdue'): { to: string; subject: string; body: string } => {
                  const to = String(campaign.campaignData?.contact_email || '');
                  const name = String(campaign.influencerName || campaign.title || 'インフルエンサー様');
                  const platformLabel = mapPlatformToJapanese(String(campaign.platform || ''));
                  const title = String(campaign.title || `${platformLabel}案件（ID: ${campaign.id.slice(-6)}）`);
                  const deadlineInfo = getDeadlineInfo(campaign);

                  let subject = '';
                  let body = '';

                  if (kind === 'trial') {
                    subject = `【スピークPR】トライアルご利用のご感想と次のステップについて`; 
                    body = `${name} 様\n\nいつもお世話になっております。スピークチームです。\n\n先日ご案内したトライアルのご利用状況はいかがでしょうか。${platformLabel}での${title}に向けた進行について、\n簡単なご感想やご不明点などございましたらお知らせいただけますと幸いです。\n\n引き続きどうぞよろしくお願いいたします。\n\nスピークチーム`;
                  } else if (kind === 'meeting') {
                    subject = `【スピークPR】打ち合わせ日程のご調整について`; 
                    body = `${name} 様\n\nいつもお世話になっております。スピークチームです。\n\n${platformLabel}での${title}に関して、打ち合わせ日程のご調整のご連絡です。\nご都合の良い候補日時を2〜3つお知らせいただけますでしょうか。\nオンラインで30分程度を想定しております。\n\nお忙しいところ恐れ入りますが、何卒よろしくお願いいたします。\n\nスピークチーム`;
                  } else {
                    const deadlineText = deadlineInfo ? `${deadlineInfo.label}${deadlineInfo.date ? `（${deadlineInfo.date}）` : ''}` : '期限';
                    subject = `【スピークPR】${deadlineText}のご確認のお願い`;
                    body = `${name} 様\n\nいつもお世話になっております。スピークチームです。\n\n${platformLabel}での${title}に関しまして、${deadlineText}を過ぎておりますため、\n恐れ入りますが現状の進捗と今後のご予定をお知らせいただけますでしょうか。\n\nご対応のほど、何卒よろしくお願いいたします。\n\nスピークチーム`;
                  }

                  return { to, subject, body };
                };

                const sendReminder = async (campaign: Campaign, kind: 'trial' | 'meeting' | 'overdue') => {
                  const key = `${campaign.id}_${kind}`;
                  setReminderSending(prev => new Set(prev).add(key));
                  try {
                    // For overdue, use 'draft' as reminderType (since it's about draft deadline)
                    const reminderType = kind === 'overdue' ? 'draft' : kind;
                    const res = await fetch('/api/admin/actions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        campaignId: campaign.id,
                        influencerId: campaign.influencerId,
                        action: 'send_reminder',
                        reminderType: reminderType,
                      })
                    });
                    const data = await res.json();
                    if (!res.ok || !data.success) throw new Error(data.error || 'Failed');
                    alert(data.message || 'リマインダー送信しました');
                  } catch (e: any) {
                    alert(`エラー: ${e?.message || e}`);
                  } finally {
                    setReminderSending(prev => {
                      const next = new Set(prev);
                      next.delete(key);
                      return next;
                    });
                  }
                };

                return (
                  <div className="space-y-4">
                    {/* リマインダー */}
                    <div className="rounded-lg p-4 sm:p-5" style={{ 
                      backgroundColor: ds.bg.card,
                      borderColor: ds.border.primary,
                      borderWidth: '1px',
                      borderStyle: 'solid'
                    }}>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: colors.status.orange.bg }}>
                          <Clock size={12} style={{ color: colors.status.orange[500] }} />
                        </div>
                        <h3 className="font-medium" style={{ 
                          color: ds.text.primary, 
                          fontSize: `${ds.typography.heading.h3.fontSize}px`,
                          lineHeight: ds.typography.heading.h3.lineHeight,
                          fontWeight: ds.typography.heading.h3.fontWeight
                        }}>
                          リマインダー
                        </h3>
                      </div>
                      
                      <div className="space-y-3">
                        {items.length === 0 && queuedEmailActions.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="w-8 h-8 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: ds.bg.surface }}>
                              <Clock size={16} style={{ color: ds.text.secondary }} />
                            </div>
                            <p className="font-medium mb-1" style={{ 
                              color: ds.text.primary,
                              fontSize: `${ds.typography.text.sm.fontSize}px`,
                              lineHeight: ds.typography.text.sm.lineHeight
                            }}>アクションなし</p>
                            <p style={{ 
                              color: ds.text.secondary,
                              fontSize: `${ds.typography.text.sm.fontSize}px`,
                              lineHeight: ds.typography.text.sm.lineHeight
                            }}>現在対応が必要なリマインダーやフォローアップはありません。</p>
                          </div>
                        ) : (
                          <>
                          {items.map(({ campaign: c, kind, reason }) => (
                            <div key={`${c.id}_${kind}`} className="p-3">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div 
                                      className={`w-1.5 h-1.5 rounded-full ${kind === 'overdue' ? 'animate-pulse' : ''}`} 
                                      style={{ backgroundColor: kind === 'overdue' ? colors.status.red[500] : colors.status.orange[400] }}
                                    ></div>
                                    <p className="font-medium truncate" style={{ 
                                      color: ds.text.primary,
                                      fontSize: `${ds.typography.text.sm.fontSize}px`,
                                      lineHeight: ds.typography.text.sm.lineHeight
                                    }}>
                                      {c.influencerName}
                                    </p>
                                    <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ 
                                      backgroundColor: kind === 'overdue' ? colors.status.red.bg : ds.bg.surface,
                                      color: kind === 'overdue' ? colors.status.red[500] : ds.text.secondary,
                                      borderColor: kind === 'overdue' ? colors.status.red.border : ds.border.primary,
                                      borderWidth: '1px',
                                      borderStyle: 'solid'
                                    }}>
                                      {mapPlatformToJapanese(String(c.platform))}
                                    </span>
                                  </div>
                                  <p className="text-xs" style={{ color: kind === 'overdue' ? colors.status.red[600] : ds.text.secondary }}>
                                    {reason}
                                  </p>
                                </div>
                                
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {(() => {
                                    const email = buildEmail(c, kind);
                                    const mailto = `mailto:${encodeURIComponent(email.to)}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
                                    const copyKey = `${c.id}_${kind}`;
                                    const isCopied = copiedItems.has(copyKey);
                                    return (
                                      <>
                                        <button
                                          onClick={async () => {
                                            try {
                                              await navigator.clipboard.writeText(`${email.subject}\n\n${email.body}`);
                                              setCopiedItems(prev => new Set(prev).add(copyKey));
                                              setTimeout(() => {
                                                setCopiedItems(prev => {
                                                  const next = new Set(prev);
                                                  next.delete(copyKey);
                                                  return next;
                                                });
                                              }, 2000);
                                            } catch (err) {
                                              console.error('Copy failed:', err);
                                            }
                                          }}
                                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                                          style={{ 
                                            backgroundColor: isCopied ? colors.status.emerald[500] : ds.button.secondary.bg, 
                                            color: isCopied ? 'white' : ds.button.secondary.text, 
                                            borderColor: isCopied ? colors.status.emerald[500] : ds.border.primary, 
                                            borderWidth: '1px', 
                                            borderStyle: 'solid' 
                                          }}
                                          onMouseEnter={(e) => !isCopied && (e.currentTarget.style.backgroundColor = ds.button.secondary.hover)}
                                          onMouseLeave={(e) => !isCopied && (e.currentTarget.style.backgroundColor = ds.button.secondary.bg)}
                                        >
                                          {isCopied ? <Check size={12} /> : <Copy size={12} />}
                                          内容をコピー
                                        </button>
                                        <a
                                          href={mailto}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                                          style={{ backgroundColor: ds.button.primary.bg, color: ds.button.primary.text }}
                                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = ds.button.primary.hover)}
                                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ds.button.primary.bg)}
                                        >
                                          <Mail size={12} />
                                          メール作成
                                        </a>
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          ))}
                          {queuedEmailActions.map((q, idx) => (
                            <div key={`${q.campaignId}_${q.followupType}_${idx}`} className="p-3">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.status.blue[400] }}></div>
                                    <p className="font-medium truncate" style={{ 
                                      color: ds.text.primary,
                                      fontSize: `${ds.typography.text.sm.fontSize}px`,
                                      lineHeight: ds.typography.text.sm.lineHeight
                                    }}>
                                      {q.influencerName}
                                    </p>
                                    <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ 
                                      backgroundColor: q.followupType === 'approval' ? colors.status.emerald.bg : colors.status.orange.bg,
                                      color: q.followupType === 'approval' ? colors.status.emerald[500] : colors.status.orange[500]
                                    }}>
                                      {q.submissionType === 'plan' ? '構成案' : '初稿'} {q.followupType === 'approval' ? '承認' : '修正依頼'}
                                    </span>
                                  </div>
                                  <p className="text-xs" style={{ color: ds.text.secondary }}>
                                    メール送付待ち
                                  </p>
                                </div>
                                
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <button
                                    onClick={() => {
                                      const next = queuedEmailActions.filter((_, i) => i !== idx);
                                      setQueuedEmailActions(next);
                                      localStorage.setItem('postEmailActions', JSON.stringify(next));
                                      alert('メール送信（ダミー）を完了として記録しました');
                                    }}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                                    style={{ 
                                      backgroundColor: ds.button.secondary.bg, 
                                      color: ds.button.secondary.text,
                                      borderColor: ds.border.primary,
                                      borderWidth: '1px',
                                      borderStyle: 'solid'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.hover}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.bg}
                                  >
                                    <Mail size={12} />
                                    送信する
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
          </div>
        ) : activeTab === 'comms' ? (
          /* 連絡 Tab */
          <CommsPanel />
        ) : (
          /* Settings Tab */
          <SettingsPanel />
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && currentRevisionAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-xl p-6 max-w-md w-full mx-4" style={{ backgroundColor: ds.bg.card }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: ds.text.primary }}>
              修正依頼
            </h3>
            <p className="text-sm mb-4" style={{ color: ds.text.secondary }}>
              {currentRevisionAction.update.influencerName}さんの
              {currentRevisionAction.update.submissionType === 'plan' ? '構成案' : '初稿'}
              に対するフィードバックをご入力ください。
            </p>
            <textarea
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              placeholder="修正点や改善提案をご入力ください..."
              className="w-full h-32 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 resize-none"
              style={{
                backgroundColor: ds.form.input.bg,
                borderColor: ds.form.input.border,
                color: ds.text.primary,
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setCurrentRevisionAction(null);
                  setFeedbackMessage('');
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: ds.button.secondary.bg,
                  color: ds.button.secondary.text,
                  borderColor: ds.border.primary,
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.bg}
              >
                キャンセル
              </button>
              <button
                onClick={handleFeedbackSubmit}
                disabled={!feedbackMessage.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: ds.button.primary.bg,
                  color: ds.button.primary.text
                }}
                onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = ds.button.primary.hover)}
                onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = ds.button.primary.bg)}
              >
                修正依頼を送信
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal with Mailto Link */}
      {showSuccessModal && successModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-xl p-6 max-w-md w-full mx-4" style={{ backgroundColor: ds.bg.card }}>
            <div className="flex items-center mb-4">
              <div className="mr-3 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#10b981' }}>
                <Check size={20} style={{ color: 'white' }} />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: ds.text.primary }}>
                修正依頼を送信しました
              </h3>
            </div>
            
            <p className="text-sm mb-4" style={{ color: ds.text.secondary }}>
              {successModalData.influencerName}さんの{successModalData.submissionType}に対する修正依頼がダッシュボードに反映されました。
            </p>

            <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: ds.bg.surface }}>
              <p className="text-sm font-medium mb-2" style={{ color: ds.text.primary }}>
                メールでも連絡する：
              </p>
              {successModalData.influencerEmail ? (
                <a
                  href={`mailto:${successModalData.influencerEmail}?subject=${encodeURIComponent(`【Speak】${successModalData.submissionType}の修正依頼`)}&body=${encodeURIComponent(`${successModalData.influencerName}さん\n\nお疲れ様です。\n\nご提出いただいた${successModalData.submissionType}を確認いたしました。\n以下の点について修正をお願いいたします。\n\n${successModalData.feedbackMessage}\n\nご確認のほどよろしくお願いいたします。`)}`}
                  className="flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full"
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
                  <Mail size={16} className="mr-2" />
                  メールアプリで開く
                </a>
              ) : (
                <div>
                  <div className="text-sm p-3 rounded-lg mb-3" style={{ 
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: ds.text.secondary,
                    borderColor: 'rgba(239, 68, 68, 0.2)',
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  }}>
                    <p className="mb-1">⚠️ メールアドレスが登録されていません</p>
                    <p className="text-xs">Google Sheetの「contact_email」列にメールアドレスを追加してください。</p>
                  </div>
                  <div className="p-3 rounded-lg mb-2" style={{
                    backgroundColor: ds.form.input.bg,
                    borderColor: ds.form.input.border,
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  }}>
                    <p className="text-xs mb-1" style={{ color: ds.text.secondary }}>件名：</p>
                    <p className="text-sm mb-3" style={{ color: ds.text.primary }}>【Speak】{successModalData.submissionType}の修正依頼</p>
                    <p className="text-xs mb-1" style={{ color: ds.text.secondary }}>本文：</p>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: ds.text.primary }}>
                      {`${successModalData.influencerName}さん\n\nお疲れ様です。\n\nご提出いただいた${successModalData.submissionType}を確認いたしました。\n以下の点について修正をお願いいたします。\n\n${successModalData.feedbackMessage}\n\nご確認のほどよろしくお願いいたします。`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const emailContent = `件名：【Speak】${successModalData.submissionType}の修正依頼\n\n本文：\n${successModalData.influencerName}さん\n\nお疲れ様です。\n\nご提出いただいた${successModalData.submissionType}を確認いたしました。\n以下の点について修正をお願いいたします。\n\n${successModalData.feedbackMessage}\n\nご確認のほどよろしくお願いいたします。`;
                      navigator.clipboard.writeText(emailContent);
                      alert('メール内容をコピーしました！');
                    }}
                    className="flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full"
                    style={{
                      backgroundColor: ds.button.secondary.bg,
                      color: ds.button.secondary.text,
                      borderColor: ds.border.primary,
                      borderWidth: '1px',
                      borderStyle: 'solid'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.hover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.bg}
                  >
                    <Copy size={16} className="mr-2" />
                    メール内容をコピー
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setSuccessModalData(null);
                  window.location.reload();
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: ds.button.primary.bg,
                  color: ds.button.primary.text
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.button.primary.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ds.button.primary.bg}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}