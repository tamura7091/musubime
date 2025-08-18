'use client';

import { useAuth } from '@/contexts/AuthContext';
import { mockCampaigns } from '@/lib/mock-data';
import CampaignCard from '@/components/CampaignCard';
import StatusSection from '@/components/StatusSection';
import { TrendingUp, Clock, CheckCircle } from 'lucide-react';

export default function InfluencerDashboard() {
  const { user } = useAuth();
  
  if (!user || user.role !== 'influencer') {
    return <div>アクセスが拒否されました</div>;
  }

  const userCampaigns = mockCampaigns.filter(campaign => campaign.influencerId === user.id);
  const activeCampaigns = userCampaigns.filter(campaign => 
    !['completed', 'cancelled'].includes(campaign.status)
  );
  const completedCampaigns = userCampaigns.filter(campaign => 
    campaign.status === 'completed'
  );

  const totalEarnings = userCampaigns
    .filter(campaign => campaign.status === 'completed')
    .reduce((sum, campaign) => sum + (campaign.contractedPrice || 0), 0);

  const pendingActions = activeCampaigns.filter(campaign => 
    ['plan_submission', 'content_creation', 'ready_to_publish'].includes(campaign.status)
  ).length;

  // Calculate progress percentage
  const calculateProgress = (campaign: any) => {
    const stepOrder = [
      'meeting_scheduled', 'contract_pending', 'plan_submission', 'plan_review',
      'content_creation', 'draft_submitted', 'draft_review', 'ready_to_publish',
      'live', 'payment_processing', 'completed'
    ];
    const currentIndex = stepOrder.indexOf(campaign.status);
    return Math.round((currentIndex / (stepOrder.length - 1)) * 100);
  };

  // Show 100% progress if no active campaigns (no promo ongoing)
  const overallProgress = activeCampaigns.length === 0 
    ? 100 
    : userCampaigns.length > 0 
      ? Math.round(userCampaigns.reduce((sum, campaign) => sum + calculateProgress(campaign), 0) / userCampaigns.length)
      : 0;

  // Get the most active campaign for status display
  const primaryCampaign = activeCampaigns[0] || userCampaigns[0];

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-7xl mx-auto mobile-padding">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-dark-text mb-2">
            お疲れ様です、{user.name}さん
          </h1>
          <p className="text-dark-text-secondary mobile-text">
            プロモーションの進捗状況と次のステップをご確認ください
          </p>
        </div>

        {/* Stats Overview */}
        <div className="mobile-grid mb-6 sm:mb-8">
          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-dark-accent/20 rounded-lg flex-shrink-0">
                <TrendingUp className="text-dark-accent" size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-dark-text">
                  ¥{totalEarnings.toLocaleString()}
                </p>
                <p className="text-dark-text-secondary text-xs sm:text-sm">総報酬額</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-500/20 rounded-lg flex-shrink-0">
                <Clock className="text-orange-400" size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-dark-text">
                  {pendingActions}
                </p>
                <p className="text-dark-text-secondary text-xs sm:text-sm">要対応</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg flex-shrink-0">
                <CheckCircle className="text-green-400" size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-dark-text">
                  {overallProgress}%
                </p>
                <p className="text-dark-text-secondary text-xs sm:text-sm">プログレス</p>
              </div>
            </div>
          </div>
      </div>

        {/* Status Section */}
        {primaryCampaign && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-dark-text mb-4 sm:mb-6">
              ステータス
            </h2>
            <StatusSection campaign={primaryCampaign} />
          </div>
        )}

        {/* Active Campaigns */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-dark-text mb-4">
            プロモーション詳細
          </h2>
          {activeCampaigns.length > 0 ? (
            <div className="space-y-4">
              {activeCampaigns.map(campaign => (
                <div key={campaign.id} className="card">
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
                        <h3 className="text-dark-text font-medium mobile-text truncate">
                          {campaign.title}
                        </h3>
                        <p className="text-dark-text-secondary text-xs sm:text-sm">
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
                  
                    <div className={`status-badge flex-shrink-0 ${
                      campaign.status === 'meeting_scheduled' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                      campaign.status === 'contract_pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      campaign.status === 'plan_submission' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                      campaign.status === 'plan_review' ? 'bg-orange-600/20 text-orange-300 border-orange-600/30' :
                      campaign.status === 'content_creation' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                      campaign.status === 'draft_submitted' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' :
                      campaign.status === 'draft_review' ? 'bg-indigo-600/20 text-indigo-300 border-indigo-600/30' :
                      campaign.status === 'ready_to_publish' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      campaign.status === 'live' ? 'bg-green-600/20 text-green-300 border-green-600/30' :
                      campaign.status === 'payment_processing' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                      'bg-gray-500/20 text-gray-400 border-gray-500/30'
                    }`}>
                    {campaign.status === 'meeting_scheduled' && '打ち合わせ予定'}
                    {campaign.status === 'contract_pending' && '契約書待ち'}
                    {campaign.status === 'plan_submission' && '構成案提出待ち'}
                    {campaign.status === 'plan_review' && '構成案確認中'}
                    {campaign.status === 'content_creation' && 'コンテンツ制作中'}
                    {campaign.status === 'draft_submitted' && '初稿提出済み'}
                    {campaign.status === 'draft_review' && '初稿確認中'}
                    {campaign.status === 'ready_to_publish' && '投稿準備完了'}
                    {campaign.status === 'live' && '投稿済み'}
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
                      <span className="text-dark-text font-medium">
                        ¥{(campaign.contractedPrice || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm">
                      <p className="font-medium text-dark-text mb-1">Next:</p>
                      <p className="text-dark-text-secondary">
                        {campaign.status === 'meeting_scheduled' && '打ち合わせにご参加ください'}
                        {campaign.status === 'contract_pending' && '契約書をご確認・サインしてください'}
                        {campaign.status === 'plan_submission' && '構成案をご提出ください'}
                        {campaign.status === 'plan_review' && '構成案の確認をお待ちください'}
                        {campaign.status === 'content_creation' && 'コンテンツの制作を開始してください'}
                        {campaign.status === 'draft_submitted' && '初稿の確認をお待ちください'}
                        {campaign.status === 'draft_review' && '修正があれば対応してください'}
                        {campaign.status === 'ready_to_publish' && 'コンテンツを投稿してください'}
                        {campaign.status === 'live' && '送金手続きをお待ちください'}
                        {campaign.status === 'payment_processing' && 'お支払い処理中です'}
                        {campaign.status === 'completed' && 'プロモーション完了'}
                      </p>
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
                      <p className="font-medium text-dark-text mb-2">参考リンク</p>
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
            <h2 className="text-lg sm:text-xl font-semibold text-dark-text mb-4">
              完了済みプロモーション
            </h2>
          <div className="space-y-4">
            {completedCampaigns.map(campaign => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}