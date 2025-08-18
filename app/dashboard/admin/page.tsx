'use client';

import { useAuth } from '@/contexts/AuthContext';
import { mockUpdates } from '@/lib/mock-data';
import { Users, TrendingUp, Clock, AlertCircle, Search, Filter, User, Tag, ChevronUp, ChevronDown } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Campaign } from '@/types';

export default function AdminDashboard() {
  console.log('🎯 AdminDashboard component rendering');
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  
  console.log('👤 Current user:', user);

  // Fetch campaigns from API - must be before early returns
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        console.log('📊 Fetching campaigns from API...');
        setLoading(true);
        const response = await fetch('/api/campaigns');
        if (response.ok) {
          const campaigns = await response.json();
          console.log('✅ Campaigns loaded:', campaigns.length);
          setAllCampaigns(campaigns);
        } else {
          console.error('❌ Failed to fetch campaigns:', response.status);
        }
      } catch (error) {
        console.error('❌ Error fetching campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
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
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-accent mx-auto mb-4"></div>
          <p className="text-dark-text-secondary">キャンペーンデータを読み込み中...</p>
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


  const recentUpdates = mockUpdates.slice(0, 5);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'たった今';
    if (diffInHours < 24) return `${diffInHours}時間前`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}日前`;
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '未定';
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'numeric',
      day: 'numeric'
    }).format(new Date(date));
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
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-7xl mx-auto mobile-padding">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-dark-text mb-2">
            管理者ダッシュボード
          </h1>
          <p className="text-dark-text-secondary mobile-text">
            全インフルエンサーキャンペーンの概要と最新の活動状況
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-dark-accent/20 rounded-lg">
                <TrendingUp className="text-dark-accent" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-dark-text">
                  ¥{totalValue.toLocaleString()}
                </p>
                <p className="text-dark-text-secondary text-sm">総契約額</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-dark-text">
                  {uniqueInfluencers.length}
                </p>
                <p className="text-dark-text-secondary text-sm">インフルエンサー</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Clock className="text-orange-400" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-dark-text">
                  {activeCampaigns.length}
                </p>
                <p className="text-dark-text-secondary text-sm">進行中</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertCircle className="text-red-400" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-dark-text">
                  {pendingApprovals}
                </p>
                <p className="text-dark-text-secondary text-sm">要確認</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full">
            {/* Latest Updates */}
            <div className="card mb-6">
              <h3 className="text-lg font-semibold text-dark-text mb-4">
                アップデート
              </h3>
              <div className="space-y-4">
                {recentUpdates.map(update => (
                  <div key={update.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-dark-accent rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-dark-text">
                        {update.message}
                      </p>
                      <p className="text-xs text-dark-text-secondary mt-1">
                        {formatTimeAgo(update.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Campaigns Table */}
            <div className="card">
              <h2 className="text-xl font-semibold text-dark-text mb-4">
                キャンペーン一覧 ({filteredCampaigns.length})
              </h2>
              
              {/* Search and Filters */}
              <div className="mb-6">
                <div className="flex flex-col gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-text-secondary" size={16} />
                      <input
                        type="text"
                        placeholder="インフルエンサー名またはキャンペーン名で検索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-10 w-full"
                      />
                    </div>
                  </div>
                  
                  {/* Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Status Filter */}
                    <div className="flex items-center space-x-2">
                      <Filter size={16} className="text-dark-text-secondary flex-shrink-0" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="input w-full"
                      >
                        <option value="all">全てのステータス</option>
                        {uniqueStatuses.map(status => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Platform Filter */}
                    <div className="flex items-center space-x-2">
                      <Tag size={16} className="text-dark-text-secondary flex-shrink-0" />
                      <select
                        value={platformFilter}
                        onChange={(e) => setPlatformFilter(e.target.value)}
                        className="input w-full"
                      >
                        <option value="all">全てのプラットフォーム</option>
                        {uniquePlatforms.map(platform => (
                          <option key={platform} value={platform}>
                            {platform}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border border-dark-border rounded-lg overflow-hidden isolate">
                <div 
                  className="max-h-[600px] overflow-y-auto scroll-smooth"
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
                      <table className="min-w-full divide-y divide-dark-border">
                        <thead className="sticky top-0 bg-dark-surface/30 z-10">
                          <tr className="bg-dark-surface/30 border-b border-dark-border h-16">
                            <th className="text-left py-3 px-4 text-sm font-medium text-dark-text-secondary whitespace-nowrap min-w-[200px] h-16 align-middle">
                              インフルエンサー
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-dark-text-secondary whitespace-nowrap min-w-[120px] h-16 align-middle">
                              プラットフォーム
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-dark-text-secondary whitespace-nowrap min-w-[140px] h-16 align-middle">
                              ステータス
                            </th>
                            <th 
                              className="text-left py-3 px-4 text-sm font-medium text-dark-text-secondary whitespace-nowrap min-w-[120px] h-16 align-middle cursor-pointer hover:bg-dark-surface/50 transition-colors"
                              onClick={() => handleSort('contractedPrice')}
                            >
                              <div className="flex items-center justify-between">
                                報酬額
                                <div className="flex flex-col ml-1">
                                  <ChevronUp 
                                    size={12} 
                                    className={`${sortField === 'contractedPrice' && sortDirection === 'asc' ? 'text-dark-accent' : 'text-dark-text-secondary/30'}`} 
                                  />
                                  <ChevronDown 
                                    size={12} 
                                    className={`${sortField === 'contractedPrice' && sortDirection === 'desc' ? 'text-dark-accent' : 'text-dark-text-secondary/30'}`} 
                                  />
                                </div>
                              </div>
                            </th>
                            <th 
                              className="text-left py-3 px-4 text-sm font-medium text-dark-text-secondary whitespace-nowrap min-w-[140px] h-16 align-middle cursor-pointer hover:bg-dark-surface/50 transition-colors"
                              onClick={() => handleSort('planSubmissionDate')}
                            >
                              <div className="flex items-center justify-between">
                                構成案提出日
                                <div className="flex flex-col ml-1">
                                  <ChevronUp 
                                    size={12} 
                                    className={`${sortField === 'planSubmissionDate' && sortDirection === 'asc' ? 'text-dark-accent' : 'text-dark-text-secondary/30'}`} 
                                  />
                                  <ChevronDown 
                                    size={12} 
                                    className={`${sortField === 'planSubmissionDate' && sortDirection === 'desc' ? 'text-dark-accent' : 'text-dark-text-secondary/30'}`} 
                                  />
                                </div>
                              </div>
                            </th>
                            <th 
                              className="text-left py-3 px-4 text-sm font-medium text-dark-text-secondary whitespace-nowrap min-w-[140px] h-16 align-middle cursor-pointer hover:bg-dark-surface/50 transition-colors"
                              onClick={() => handleSort('draftSubmissionDate')}
                            >
                              <div className="flex items-center justify-between">
                                初稿提出日
                                <div className="flex flex-col ml-1">
                                  <ChevronUp 
                                    size={12} 
                                    className={`${sortField === 'draftSubmissionDate' && sortDirection === 'asc' ? 'text-dark-accent' : 'text-dark-text-secondary/30'}`} 
                                  />
                                  <ChevronDown 
                                    size={12} 
                                    className={`${sortField === 'draftSubmissionDate' && sortDirection === 'desc' ? 'text-dark-accent' : 'text-dark-text-secondary/30'}`} 
                                  />
                                </div>
                              </div>
                            </th>
                            <th 
                              className="text-left py-3 px-4 text-sm font-medium text-dark-text-secondary whitespace-nowrap min-w-[120px] h-16 align-middle cursor-pointer hover:bg-dark-surface/50 transition-colors"
                              onClick={() => handleSort('liveDate')}
                            >
                              <div className="flex items-center justify-between">
                                投稿日
                                <div className="flex flex-col ml-1">
                                  <ChevronUp 
                                    size={12} 
                                    className={`${sortField === 'liveDate' && sortDirection === 'asc' ? 'text-dark-accent' : 'text-dark-text-secondary/30'}`} 
                                  />
                                  <ChevronDown 
                                    size={12} 
                                    className={`${sortField === 'liveDate' && sortDirection === 'desc' ? 'text-dark-accent' : 'text-dark-text-secondary/30'}`} 
                                  />
                                </div>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-dark-bg divide-y divide-dark-border/30">
                          {filteredCampaigns.map(campaign => (
                            <tr key={campaign.id} className="hover:bg-dark-surface/30 transition-colors h-16">
                              <td className="py-3 px-4 h-16">
                                <div className="flex items-center space-x-3 h-full">
                                  {campaign.influencerAvatar ? (
                                    <img
                                      src={campaign.influencerAvatar}
                                      alt={campaign.influencerName || campaign.title}
                                      className="w-8 h-8 rounded-full"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-dark-accent rounded-full flex items-center justify-center">
                                      <User size={14} className="text-white" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-dark-text truncate">
                                      {campaign.influencerName || campaign.title || `Campaign ${campaign.id}`}
                                    </p>
                                    <p className="text-xs text-dark-text-secondary truncate">
                                      {campaign.title}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 h-16">
                                <div className="flex items-center h-full">
                                  <span className="text-sm text-dark-text-secondary truncate">
                                    {campaign.platform}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 h-16">
                                <div className="flex items-center h-full">
                                  <span className="text-sm text-dark-text-secondary truncate">
                                    {campaign.status}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 h-16">
                                <div className="flex items-center h-full">
                                  <span className="text-sm text-dark-text truncate">
                                    ¥{(campaign.contractedPrice || 0).toLocaleString()}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 h-16">
                                <div className="flex items-center h-full">
                                  <span className="text-sm text-dark-text-secondary truncate">
                                    {campaign.schedules?.planSubmissionDate ? 
                                      formatDate(new Date(campaign.schedules.planSubmissionDate)) : 
                                      '未定'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 h-16">
                                <div className="flex items-center h-full">
                                  <span className="text-sm text-dark-text-secondary truncate">
                                    {campaign.schedules?.draftSubmissionDate ? formatDate(new Date(campaign.schedules.draftSubmissionDate)) : '未定'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 h-16">
                                <div className="flex items-center h-full">
                                  <span className="text-sm text-dark-text-secondary truncate">
                                    {campaign.schedules?.liveDate ? formatDate(new Date(campaign.schedules.liveDate)) : '未定'}
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
                <div className="text-center py-8 text-dark-text-secondary">
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