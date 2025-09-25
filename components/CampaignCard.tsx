import { Campaign, getStepFromStatus, getStepLabel } from '@/types';
import StatusBadge from './StatusBadge';
// Removed demo helpers; provide minimal labels locally
const getPlatformLabel = (platform: string) => {
  const map: Record<string, string> = {
    youtube_long: 'YouTube長編',
    youtube_short: 'YouTubeショート',
    instagram_reel: 'Instagramリール',
    tiktok: 'TikTok',
    x_twitter: 'X (Twitter)',
    podcast: 'ポッドキャスト',
    blog: 'ブログ',
  };
  return map[platform] || platform;
};

const getPlatformIcon = (platform: string) => {
  const map: Record<string, string> = {
    youtube_long: '🎥',
    youtube_short: '📱',
    instagram_reel: '📸',
    tiktok: '🎵',
    x_twitter: '🐦',
    podcast: '🎙️',
    blog: '✍️',
  };
  return map[platform] || '📱';
};

const getNextStep = (status: string) => {
  const map: Record<string, string> = {
    not_started: 'プロモーション開始の準備をしています',
    meeting_scheduling: '打ち合わせの予約をお待ちください',
    meeting_scheduled: '打ち合わせにご参加ください',
    contract_pending: 'オンライン契約の署名を完了してください',
    trial: 'ガイドラインの確認とプレミアムの試用を行ってください',
    plan_creating: '構成案の作成を開始してください',
    plan_submitted: '構成案の確認をお待ちください',
    plan_revising: '修正版構成案をご提出ください',
    draft_creating: '初稿の作成を開始してください',
    draft_submitted: '初稿の確認をお待ちください',
    draft_revising: '修正版初稿をご提出ください',
    scheduling: 'コンテンツを投稿してください',
    scheduled: '送金手続きをお待ちください',
    payment_processing: 'お支払い処理中です',
    completed: 'プロモーション完了',
    cancelled: 'キャンペーンキャンセル済み',
  };
  return map[status] || 'ステータスを確認中です';
};
import { Calendar, ExternalLink, ChevronRight, ChevronDown, User } from 'lucide-react';
import { useState } from 'react';
import OnboardingSurvey from './OnboardingSurvey';
import VisibilityToggle from './VisibilityToggle';
import { useDesignSystem } from '@/hooks/useDesignSystem';
import { formatAbbreviatedCurrency } from '@/lib/design-system';

interface CampaignCardProps {
  campaign: Campaign;
  showInfluencer?: boolean;
}

export default function CampaignCard({ campaign, showInfluencer = false }: CampaignCardProps) {
  const ds = useDesignSystem();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);

  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return '未定';
    
    // Handle empty strings
    if (typeof date === 'string' && date.trim() === '') return '未定';
    
    try {
      const dateObj = new Date(date);
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) return '未定';
      
      return new Intl.DateTimeFormat('ja-JP', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
      }).format(dateObj);
    } catch (error) {
      console.warn('Invalid date value:', date);
      return '未定';
    }
  };

  const formatCurrency = (amount: number | null | undefined, currency: string) => {
    const safeAmount = amount || 0;
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency
    }).format(safeAmount);
  };

  return (
    <div className="rounded-xl p-4 sm:p-6 transition-all duration-200" style={{ 
      backgroundColor: ds.bg.card,
      borderColor: isExpanded ? ds.border.primary : ds.border.secondary,
      borderWidth: '1px',
      borderStyle: 'solid'
    }}>
      {/* Header - Always visible */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3 flex-1">
          {/* Toggle Icon */}
          <div style={{ color: ds.text.secondary }}>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          
          {/* Platform Icon */}
          <div className="text-lg">
            {getPlatformIcon(campaign.platform)}
          </div>
          
          {/* Title and Platform */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate" style={{ color: ds.text.primary }}>
              {campaign.title}
            </h3>
            <p className="text-sm" style={{ color: ds.text.secondary }}>
              {getPlatformLabel(campaign.platform)}
            </p>
          </div>
          
          {/* Influencer (if admin view) */}
          {showInfluencer && (
            <div className="flex items-center space-x-2">
              {campaign.influencerAvatar ? (
                <img
                  src={campaign.influencerAvatar}
                  alt={campaign.influencerName}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: ds.button.primary.bg }}>
                  <User size={12} style={{ color: ds.button.primary.text }} />
                </div>
              )}
              <span className="text-sm" style={{ color: ds.text.secondary }}>
                {campaign.influencerName}
              </span>
            </div>
          )}
        </div>
        
        {/* Step Badge */}
        <div className="flex items-center space-x-2">
          <div className="text-xs" style={{ color: ds.text.secondary }}>
            {getStepLabel(getStepFromStatus(campaign.status as any))}
          </div>
          <StatusBadge status={campaign.status} />
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t space-y-4" style={{ borderColor: ds.border.secondary }}>
          {/* Price and Next Step */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 text-sm">
              <VisibilityToggle showToggleButton={false}>
                <span className="font-medium" style={{ color: ds.text.primary }}>
                  {formatAbbreviatedCurrency(campaign.contractedPrice || 0, campaign.currency)}
                </span>
              </VisibilityToggle>
            </div>
            <div className="text-sm">
              <p className="font-medium mb-1" style={{ color: ds.text.primary }}>次のステップ：</p>
              {campaign.status === 'not_started' ? (
                <div>
                  <p className="mb-2" style={{ color: ds.text.secondary }}>
                    {getNextStep(campaign.status)}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSurvey(true);
                    }}
                    className="px-4 py-2 rounded-lg transition-colors text-sm"
                    style={{ 
                      backgroundColor: ds.button.primary.bg,
                      color: ds.button.primary.text
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.button.primary.hover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ds.button.primary.bg}
                  >
                    基本情報を入力
                  </button>
                </div>
              ) : (
                <p style={{ color: ds.text.secondary }}>
                  {getNextStep(campaign.status)}
                </p>
              )}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <p className="font-medium mb-2" style={{ color: ds.text.primary }}>スケジュール</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              {campaign.schedules.meetingDate && (
                <div className="flex items-center space-x-2" style={{ color: ds.text.secondary }}>
                  <Calendar size={14} />
                  <div>
                    <p className="font-medium" style={{ color: ds.text.primary }}>打ち合わせ</p>
                    <p>{formatDate(campaign.schedules.meetingDate)}</p>
                  </div>
                </div>
              )}
              {campaign.schedules.planSubmissionDate && (
                <div className="flex items-center space-x-2" style={{ color: ds.text.secondary }}>
                  <Calendar size={14} />
                  <div>
                    <p className="font-medium" style={{ color: ds.text.primary }}>構成案提出</p>
                    <p>{formatDate(campaign.schedules.planSubmissionDate)}</p>
                  </div>
                </div>
              )}
              {campaign.schedules.draftSubmissionDate && (
                <div className="flex items-center space-x-2" style={{ color: ds.text.secondary }}>
                  <Calendar size={14} />
                  <div>
                    <p className="font-medium" style={{ color: ds.text.primary }}>初稿提出</p>
                    <p>{formatDate(campaign.schedules.draftSubmissionDate)}</p>
                  </div>
                </div>
              )}
              {campaign.schedules.liveDate && (
                <div className="flex items-center space-x-2" style={{ color: ds.text.secondary }}>
                  <Calendar size={14} />
                  <div>
                    <p className="font-medium" style={{ color: ds.text.primary }}>投稿予定</p>
                    <p>{formatDate(campaign.schedules.liveDate)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Requirements */}
          {campaign.requirements.length > 0 && (
            <div>
              <p className="font-medium mb-2" style={{ color: ds.text.primary }}>要件</p>
              <ul className="space-y-1 text-sm" style={{ color: ds.text.secondary }}>
                {campaign.requirements.map((req, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="mt-1" style={{ color: ds.text.accent }}>•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reference Links */}
          {campaign.referenceLinks.length > 0 && (
            <div>
              <p className="font-medium mb-2" style={{ color: ds.text.primary }}>参考リンク</p>
              <div className="space-y-1">
                {campaign.referenceLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm transition-colors"
                    style={{ color: ds.text.accent }}
                    onMouseEnter={(e) => e.currentTarget.style.color = ds.text.accentHover}
                    onMouseLeave={(e) => e.currentTarget.style.color = ds.text.accent}
                  >
                    <ExternalLink size={14} />
                    <span>{link.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {campaign.notes && (
            <div>
              <p className="font-medium mb-2" style={{ color: ds.text.primary }}>メモ</p>
              <p className="text-sm rounded-lg p-3" style={{ 
                color: ds.text.secondary,
                backgroundColor: ds.bg.surface
              }}>
                {campaign.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Onboarding Survey Modal */}
      {showSurvey && (
        <OnboardingSurvey
          campaignId={campaign.id}
          onComplete={() => {
            setShowSurvey(false);
            // Refresh the page to show updated data
            window.location.reload();
          }}
          onCancel={() => setShowSurvey(false)}
        />
      )}
    </div>
  );
}