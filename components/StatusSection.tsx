'use client';

import { Campaign, CampaignStatus } from '@/types';
import Tooltip from './Tooltip';
import { Check, Clock, Link as LinkIcon, Calendar, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface StatusSectionProps {
  campaign: Campaign;
}

type StepInfo = {
  id: string;
  title: string;
  description: string;
  hasLink?: boolean;
  linkPlaceholder?: string;
  dateField?: keyof Campaign['schedules'];
};

const campaignSteps: StepInfo[] = [
  {
    id: 'meeting_scheduled',
    title: '打ち合わせ',
    description: '30分のオンラインミーティングでキャンペーンの詳細を確認します。',
    dateField: 'meeting'
  },
  {
    id: 'contract_pending',
    title: '契約書サイン',
    description: '契約書をご確認いただき、電子署名をお願いします。'
  },
  {
    id: 'plan_submission',
    title: '構成案提出',
    description: 'テンプレートを使用して動画の構成案を作成・提出してください。',
    hasLink: true,
    linkPlaceholder: '構成案のリンクを貼り付けてください',
    dateField: 'planSubmission'
  },
  {
    id: 'plan_review',
    title: '構成案確認',
    description: '提出いただいた構成案を確認し、必要に応じて修正案をお送りします。'
  },
  {
    id: 'content_creation',
    title: 'コンテンツ制作',
    description: '承認された構成案に基づいてコンテンツを制作してください。'
  },
  {
    id: 'draft_submitted',
    title: '初稿提出',
    description: 'YouTubeに限定公開でアップロードし、リンクを共有してください。',
    hasLink: true,
    linkPlaceholder: '初稿動画のリンクを貼り付けてください',
    dateField: 'draftSubmission'
  },
  {
    id: 'draft_review',
    title: '初稿確認',
    description: '初稿を確認し、必要に応じて修正をお願いします。'
  },
  {
    id: 'ready_to_publish',
    title: 'アップロード',
    description: '最終確認後、指定された日時にコンテンツを投稿してください。'
  },
  {
    id: 'live',
    title: '投稿済みPR動画',
    description: '投稿済みPR動画のリンクを共有してください。',
    hasLink: true,
    linkPlaceholder: '投稿済みPR動画のリンクを貼り付けてください',
    dateField: 'publishDate'
  },
  {
    id: 'payment_processing',
    title: 'お支払い',
    description: 'お支払い処理を開始します。請求書の提出をお待ちしています。'
  }
];

export default function StatusSection({ campaign }: StatusSectionProps) {
  const [selectedStep, setSelectedStep] = useState<StepInfo | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [linkInputs, setLinkInputs] = useState<Record<string, string>>({});

  const getCurrentStepIndex = () => {
    return campaignSteps.findIndex(step => step.id === campaign.status);
  };

  const currentStepIndex = getCurrentStepIndex();
  const currentStep = campaignSteps[currentStepIndex];

  const formatDate = (date: Date | undefined) => {
    if (!date) return null;
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
  };

  const handleLinkSubmit = (stepId: string) => {
    const link = linkInputs[stepId];
    if (link) {
      // Here you would typically send this to your backend
      console.log(`Submitted link for ${stepId}:`, link);
      // Show success message or update UI
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Required - Show at top when needed */}
      {currentStep?.hasLink && (
        <div className="card border-orange-500/30 bg-orange-500/5">
          <h3 className="text-base sm:text-lg font-semibold text-dark-text mb-3 flex items-center space-x-2">
            <LinkIcon size={18} className="text-orange-400 flex-shrink-0" />
            <span className="mobile-text">「{currentStep.title}」のリンクが必要です</span>
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-dark-text mb-2">
                {currentStep.linkPlaceholder}
              </label>
              <input
                type="url"
                value={linkInputs[currentStep.id] || ''}
                onChange={(e) => setLinkInputs(prev => ({
                  ...prev,
                  [currentStep.id]: e.target.value
                }))}
                className="input w-full"
                placeholder="https://..."
              />
            </div>
            <button
              onClick={() => handleLinkSubmit(currentStep.id)}
              className="btn-primary"
              disabled={!linkInputs[currentStep.id]}
            >
              提出する
            </button>
          </div>
        </div>
      )}

      {/* Current Step Description - Above Flow */}
      {currentStep && (
        <div className="card bg-dark-accent/10 border-dark-accent/20">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-dark-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock size={14} className="text-dark-accent sm:w-4 sm:h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-dark-text mb-1 mobile-text">
                {currentStep.title} - 進行中
              </h4>
              <p className="text-xs sm:text-sm text-dark-text-secondary mb-3">
                {currentStep.description}
              </p>
              
              {currentStep.dateField && campaign.schedules[currentStep.dateField] && (
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-dark-text-secondary mb-3">
                  <Calendar size={14} className="flex-shrink-0" />
                  <span>期限: {formatDate(campaign.schedules[currentStep.dateField])}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Campaign Flow */}
      <div className="card">
        <h2 className="text-lg sm:text-xl font-semibold text-dark-text mb-4 sm:mb-6">
          プロモーションの流れ
        </h2>
        
        {/* Flow visualization */}
        <div className="relative overflow-x-auto">
          <div className="min-w-full">
            {/* Connection line */}
            <div className="absolute top-2 left-4 right-4 h-0.5 bg-dark-border"></div>
            <div 
              className="absolute top-2 left-4 h-0.5 bg-dark-accent transition-all duration-500"
              style={{ 
                width: `calc(${(currentStepIndex / (campaignSteps.length - 1)) * 100}% - 8px)` 
              }}
            ></div>

            {/* Steps */}
            <div className="relative grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-4 px-2">
              {campaignSteps.map((step, index) => {
                const status = getStepStatus(index);
                
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    {/* Step Circle */}
                                      <button
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipPosition({ 
                        x: rect.left + rect.width / 2, 
                        y: rect.top 
                      });
                      setSelectedStep(step);
                    }}
                    onMouseLeave={() => setSelectedStep(null)}
                    className={`relative w-4 h-4 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 z-10 ${
                        status === 'completed' 
                          ? 'bg-dark-accent border-dark-accent shadow-lg shadow-dark-accent/25' 
                          : status === 'current'
                          ? 'bg-dark-surface border-dark-accent shadow-lg shadow-dark-accent/25 animate-pulse'
                          : 'bg-dark-surface border-dark-border hover:border-dark-accent/50'
                      }`}
                    >
                      {status === 'completed' ? (
                        <Check size={10} className="text-white" />
                      ) : status === 'current' ? (
                        <Clock size={10} className="text-dark-accent" />
                      ) : null
                      }
                    </button>

                    {/* Step Label */}
                    <div className="mt-2 text-center max-w-16 md:max-w-20">
                      <h3 className={`font-medium text-xs leading-tight ${
                        status === 'completed' 
                          ? 'text-dark-text'
                          : 'text-dark-text-secondary'
                      }`}>
                        {step.title}
                      </h3>
                      
                      {/* Current step indicator */}
                      {status === 'current' && (
                        <div className="mt-1">
                          <div className="text-xs text-dark-accent font-medium">Now</div>
                          {step.dateField && campaign.schedules[step.dateField] && (
                            <div className="text-xs text-dark-text-secondary mt-1 hidden md:block">
                              {formatDate(campaign.schedules[step.dateField])}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Next step indicator */}
                      {index === currentStepIndex + 1 && (
                        <div className="mt-1">
                          <div className="text-xs text-orange-400 font-medium">Next</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>





      {/* Step Details Tooltip */}
      <Tooltip
        isOpen={selectedStep !== null}
        onClose={() => setSelectedStep(null)}
        position={tooltipPosition}
      >
        {selectedStep && (
          <div className="space-y-2">
            <h4 className="font-semibold text-dark-text text-sm">
              {selectedStep.title}
            </h4>
            <p className="text-xs text-dark-text-secondary">
              {selectedStep.description}
            </p>
            
            {selectedStep.dateField && campaign.schedules[selectedStep.dateField] && (
              <div className="flex items-center space-x-2 text-xs text-dark-text-secondary">
                <Calendar size={12} />
                <span>期限: {formatDate(campaign.schedules[selectedStep.dateField])}</span>
              </div>
            )}

            {selectedStep.hasLink && (
              <div className="pt-2 border-t border-dark-border">
                <p className="text-xs font-medium text-dark-text mb-1">
                  必要な提出物:
                </p>
                <p className="text-xs text-dark-text-secondary">
                  {selectedStep.linkPlaceholder}
                </p>
              </div>
            )}
          </div>
        )}
      </Tooltip>
    </div>
  );
}