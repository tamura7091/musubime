import { Campaign, getStepFromStatus, getStepLabel } from '@/types';
import StatusBadge from './StatusBadge';
import { getNextStep, getPlatformLabel, getPlatformIcon } from '@/lib/mock-data';
import { Calendar, DollarSign, ExternalLink, ChevronRight, ChevronDown, User } from 'lucide-react';
import { useState } from 'react';

interface CampaignCardProps {
  campaign: Campaign;
  showInfluencer?: boolean;
}

export default function CampaignCard({ campaign, showInfluencer = false }: CampaignCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (date: Date | undefined) => {
    if (!date) return '未定';
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  const formatCurrency = (amount: number | null | undefined, currency: string) => {
    const safeAmount = amount || 0;
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency
    }).format(safeAmount);
  };

  return (
    <div className="card hover:border-dark-accent/50 transition-all duration-200">
      {/* Header - Always visible */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3 flex-1">
          {/* Toggle Icon */}
          <div className="text-dark-text-secondary">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          
          {/* Platform Icon */}
          <div className="text-lg">
            {getPlatformIcon(campaign.platform)}
          </div>
          
          {/* Title and Platform */}
          <div className="flex-1 min-w-0">
            <h3 className="text-dark-text font-medium truncate">
              {campaign.title}
            </h3>
            <p className="text-dark-text-secondary text-sm">
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
                <div className="w-6 h-6 rounded-full bg-dark-accent flex items-center justify-center">
                  <User size={12} className="text-white" />
                </div>
              )}
              <span className="text-sm text-dark-text-secondary">
                {campaign.influencerName}
              </span>
            </div>
          )}
        </div>
        
        {/* Step Badge */}
        <div className="flex items-center space-x-2">
          <div className="text-xs text-dark-text-secondary">
            {getStepLabel(getStepFromStatus(campaign.status as any))}
          </div>
          <StatusBadge status={campaign.status} />
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-dark-border space-y-4">
          {/* Price and Next Step */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 text-sm">
              <DollarSign size={16} className="text-dark-text-secondary" />
              <span className="text-dark-text font-medium">
                {formatCurrency(campaign.contractedPrice, campaign.currency)}
              </span>
            </div>
            <div className="text-sm">
              <p className="font-medium text-dark-text mb-1">Next:</p>
              <p className="text-dark-text-secondary">
                {getNextStep(campaign.status)}
              </p>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <p className="font-medium text-dark-text mb-2">スケジュール</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              {campaign.schedules.meeting && (
                <div className="flex items-center space-x-2 text-dark-text-secondary">
                  <Calendar size={14} />
                  <div>
                    <p className="font-medium text-dark-text">打ち合わせ</p>
                    <p>{formatDate(campaign.schedules.meeting)}</p>
                  </div>
                </div>
              )}
              {campaign.schedules.planSubmission && (
                <div className="flex items-center space-x-2 text-dark-text-secondary">
                  <Calendar size={14} />
                  <div>
                    <p className="font-medium text-dark-text">構成案提出</p>
                    <p>{formatDate(campaign.schedules.planSubmission)}</p>
                  </div>
                </div>
              )}
              {campaign.schedules.draftSubmission && (
                <div className="flex items-center space-x-2 text-dark-text-secondary">
                  <Calendar size={14} />
                  <div>
                    <p className="font-medium text-dark-text">初稿提出</p>
                    <p>{formatDate(campaign.schedules.draftSubmission)}</p>
                  </div>
                </div>
              )}
              {campaign.schedules.publishDate && (
                <div className="flex items-center space-x-2 text-dark-text-secondary">
                  <Calendar size={14} />
                  <div>
                    <p className="font-medium text-dark-text">投稿予定</p>
                    <p>{formatDate(campaign.schedules.publishDate)}</p>
                  </div>
                </div>
              )}
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
              <p className="font-medium text-dark-text mb-2">メモ</p>
              <p className="text-sm text-dark-text-secondary bg-dark-bg rounded-lg p-3">
                {campaign.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}