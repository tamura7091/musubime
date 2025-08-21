'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Users, TrendingUp, Clock, AlertCircle, Search, Filter, User, Tag, ChevronUp, ChevronDown } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Campaign, Update } from '@/types';
import { useDesignSystem } from '@/hooks/useDesignSystem';
import { formatAbbreviatedCurrency } from '@/lib/design-system';

export default function AdminDashboard() {
  console.log('🎯 AdminDashboard component rendering');
  const { user } = useAuth();
  const ds = useDesignSystem();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  
  console.log('👤 Current user:', user);

  // Fetch campaigns and updates from API - must be before early returns
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('📊 Fetching campaigns and updates from API...');
        setLoading(true);
        
        // Fetch campaigns
        const campaignsResponse = await fetch('/api/campaigns');
        if (campaignsResponse.ok) {
          const campaigns = await campaignsResponse.json();
          console.log('✅ Campaigns loaded:', campaigns.length);
          setAllCampaigns(campaigns);
        } else {
          console.error('❌ Failed to fetch campaigns:', campaignsResponse.status);
        }
        
        // Fetch updates
        const updatesResponse = await fetch('/api/updates');
        if (updatesResponse.ok) {
          const updates = await updatesResponse.json();
          console.log('✅ Updates loaded:', updates.length);
          setUpdates(updates);
        } else {
          console.error('❌ Failed to fetch updates:', updatesResponse.status);
        }
      } catch (error) {
        console.error('❌ Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
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
    const filtered = allCampaigns.filter(campaign => {
      const influencerName = campaign.influencerName || campaign.title || '';
      const matchesSearch = influencerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           campaign.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
      const matchesPlatform = platformFilter === 'all' || campaign.platform === platformFilter;
      
      return matchesSearch && matchesStatus && matchesPlatform;
    });
    
    return sortCampaigns(filtered);
  }, [allCampaigns, searchTerm, statusFilter, platformFilter, sortField, sortDirection]);
  
  if (!user) {
    console.log('❌ No user found, should redirect to login');
    return <div>ログインが必要です</div>;
  }
  
  if (user.role !== 'admin') {
    console.log('❌ User is not admin:', user.role);
    return <div>アクセスが拒否されました</div>;
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
  
  const activeCampaigns = allCampaigns.filter(campaign => 
    !['completed', 'cancelled'].includes(campaign.status)
  );

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
  const pendingApprovals = allCampaigns.filter(campaign => 
    ['draft_submitted', 'plan_creating'].includes(campaign.status)
  ).length;

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


  const recentUpdates = updates.slice(0, 5);

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
      'youtube_long': 'YouTube長編',
      'youtube_short': 'YouTubeショート',
      'short_video': 'ショート動画', // Generic short video
      'instagram_reel': 'Instagramリール',
      'tiktok': 'TikTok',
      'x_twitter': 'X (Twitter)',
      'podcast': 'ポッドキャスト',
      'blog': 'ブログ',
      // Also handle the raw codes from Google Sheets
      'yt': 'YouTube長編',
      'sv': 'ショート動画',
      'ig': 'Instagramリール',
      'tt': 'TikTok',
      'tw': 'X (Twitter)',
      'pc': 'ポッドキャスト'
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
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: ds.text.primary }}>
            管理者ダッシュボード
          </h1>
          <p className="mobile-text" style={{ color: ds.text.secondary }}>
            全インフルエンサーキャンペーンの概要と最新の活動状況
          </p>
        </div>

        {/* Links Card */}
        <div className="rounded-xl p-4 sm:p-6 mb-6" style={{ 
          backgroundColor: ds.bg.card,
          borderColor: ds.border.primary,
          borderWidth: '1px',
          borderStyle: 'solid'
        }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: ds.text.primary }}>
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

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="rounded-xl p-4 sm:p-6" style={{ 
            backgroundColor: ds.bg.card,
            borderColor: ds.border.primary,
            borderWidth: '1px',
            borderStyle: 'solid'
          }}>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: ds.button.primary.bg + '20' }}>
                <TrendingUp size={24} style={{ color: ds.button.primary.bg }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: ds.text.primary }}>
                  {formatAbbreviatedCurrency(totalValue)}
                </p>
                <p className="text-sm" style={{ color: ds.text.secondary }}>総契約額</p>
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
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#3b82f6' + '20' }}>
                <Users size={24} style={{ color: '#3b82f6' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: ds.text.primary }}>
                  {uniqueInfluencers.length}
                </p>
                <p className="text-sm" style={{ color: ds.text.secondary }}>id_influencer</p>
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
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#f97316' + '20' }}>
                <Clock size={24} style={{ color: '#f97316' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: ds.text.primary }}>
                  {activeCampaigns.length}
                </p>
                <p className="text-sm" style={{ color: ds.text.secondary }}>進行中</p>
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
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#ef4444' + '20' }}>
                <AlertCircle size={24} style={{ color: '#ef4444' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: ds.text.primary }}>
                  {pendingApprovals}
                </p>
                <p className="text-sm" style={{ color: ds.text.secondary }}>要確認</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full">
            {/* Latest Updates */}
            <div className="rounded-xl p-4 sm:p-6 mb-6" style={{ 
              backgroundColor: ds.bg.card,
              borderColor: ds.border.primary,
              borderWidth: '1px',
              borderStyle: 'solid'
            }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: ds.text.primary }}>
                アップデート
              </h3>
              <div className="space-y-4">
                {recentUpdates.map((update: Update) => (
                  <div key={update.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: ds.text.accent }}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: ds.text.primary }}>
                        {update.message}
                      </p>
                      <p className="text-xs mt-1" style={{ color: ds.text.secondary }}>
                        {formatTimeAgo(update.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Campaigns Table */}
            <div className="rounded-xl p-4 sm:p-6" style={{ 
              backgroundColor: ds.bg.card,
              borderColor: ds.border.primary,
              borderWidth: '1px',
              borderStyle: 'solid'
            }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: ds.text.primary }}>
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
                        className="pl-10 w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
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
                        className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                        style={{ 
                          backgroundColor: ds.form.input.bg,
                          borderColor: ds.form.input.border,
                          color: ds.text.primary,
                          borderWidth: '1px',
                          borderStyle: 'solid'
                        }}
                      >
                        <option value="all">全てのステータス</option>
                        {uniqueStatuses.map(status => (
                          <option key={status} value={status}>
                            {mapStatusToJapanese(status)}
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
                        className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                        style={{ 
                          backgroundColor: ds.form.input.bg,
                          borderColor: ds.form.input.border,
                          color: ds.text.primary,
                          borderWidth: '1px',
                          borderStyle: 'solid'
                        }}
                      >
                        <option value="all">全てのプラットフォーム</option>
                        {uniquePlatforms.map(platform => (
                          <option key={platform} value={platform}>
                            {mapPlatformToJapanese(platform)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
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
                                    {mapPlatformToJapanese(campaign.platform)}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 h-16">
                                <div className="flex items-center h-full">
                                  <span className="text-sm truncate" style={{ color: ds.text.secondary }}>
                                    {mapStatusToJapanese(campaign.status)}
                                  </span>
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
      </div>
    </div>
  );
}