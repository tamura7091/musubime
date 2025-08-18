'use client';

import React, { useState } from 'react';
import { Campaign, getStepFromStatus, getStepOrder, getStepLabel, CampaignStep, CampaignStatus } from '../types';
import Tooltip from './Tooltip';
import { Check, Clock, Link as LinkIcon, Calendar, ChevronRight, AlertCircle } from 'lucide-react';

interface StatusSectionProps {
  campaign: Campaign;
}

type StepInfo = {
  id: CampaignStep;
  title: string;
  description: string;
  hasLink?: boolean;
  linkPlaceholder?: string;
  dateField?: keyof Campaign['schedules'];
};

const campaignSteps: StepInfo[] = [
  {
    id: 'meeting',
    title: '打ち合わせ',
    description: '30分のオンラインミーティングでキャンペーンの詳細を確認します。',
    dateField: 'meetingDate'
  },
  {
    id: 'plan_creation',
    title: '構成案作成',
    description: 'テンプレートを使用して動画の構成案を作成・提出し、承認を得ます。',
    hasLink: true,
    linkPlaceholder: '構成案のリンクを貼り付けてください',
    dateField: 'planSubmissionDate'
  },
  {
    id: 'draft_creation',
    title: '初稿作成',
    description: '承認された構成案に基づいてコンテンツを制作し、初稿を提出します。',
    hasLink: true,
    linkPlaceholder: '初稿動画のリンクを貼り付けてください',
    dateField: 'draftSubmissionDate'
  },
  {
    id: 'scheduling',
    title: 'PR投稿',
    description: '最終確認後、指定された日時にコンテンツを投稿します。',
    hasLink: true,
    linkPlaceholder: '投稿済みPR動画のリンクを貼り付けてください',
    dateField: 'liveDate'
  },
  {
    id: 'payment',
    title: 'お支払い',
    description: 'お支払い処理を開始します。請求書の提出をお待ちしています。'
  }
];

export default function StatusSection({ campaign }: StatusSectionProps) {
  const [selectedStep, setSelectedStep] = useState<StepInfo | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [linkInputs, setLinkInputs] = useState<Record<string, string>>({});

  const getCurrentStepIndex = () => {
    const currentStep = getStepFromStatus(campaign.status as CampaignStatus);
    return campaignSteps.findIndex(step => step.id === currentStep);
  };

  const currentStepIndex = getCurrentStepIndex();
  const currentStep = campaignSteps[currentStepIndex];

  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return null;
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  // Check if action is overdue (more than 1 day past due)
  const isActionOverdue = () => {
    if (!campaign.schedules?.liveDate) return false;
    
    const liveDate = new Date(campaign.schedules.liveDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    liveDate.setHours(0, 0, 0, 0);
    
    const diffTime = liveDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays < -1; // More than 1 day overdue
  };

  const getStepStatus = (stepIndex: number) => {
    // If campaign is completed, show all steps as completed
    if (campaign.status === 'completed') return 'completed';
    
    const currentStep = getStepFromStatus(campaign.status as CampaignStatus);
    const currentStepIndex = campaignSteps.findIndex(step => step.id === currentStep);
    
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
  };

  // Check if current step is delayed
  const isCurrentStepDelayed = () => {
    return isActionOverdue() && getStepStatus(getCurrentStepIndex()) === 'current';
  };

  // Get step completion status
  const getStepCompletionStatus = (step: CampaignStep) => {
    const currentStep = getStepFromStatus(campaign.status as CampaignStatus);
    const stepOrder = ['meeting', 'plan_creation', 'draft_creation', 'scheduling', 'payment'];
    const currentStepIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);
    
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'in_progress';
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

      {/* Current Step Description - Above Flow */}
      {campaign.status === 'completed' ? (
        <div className="card bg-green-500/10 border-green-500/20">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Check size={14} className="text-green-500 sm:w-4 sm:h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-dark-text mb-1 mobile-text">
                完了 - お疲れ様でした！
              </h4>
              <p className="text-xs sm:text-sm text-dark-text-secondary mb-3">
                このキャンペーンは正常に完了しました。ご協力ありがとうございました。
              </p>
            </div>
          </div>
        </div>
      ) : currentStep && (
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
                  <span>期限: {campaign.schedules[currentStep.dateField]}</span>
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
                width: `calc(${campaign.status === 'completed' ? 100 : (() => {
                  const currentStep = getStepFromStatus(campaign.status as CampaignStatus);
                  const currentStepIndex = campaignSteps.findIndex(step => step.id === currentStep);
                  const totalSteps = campaignSteps.length;
                  
                  // Super simple: count completed steps and divide by 5
                  let completedSteps = 0;
                  for (let i = 0; i < currentStepIndex; i++) {
                    completedSteps++;
                  }
                  const progress = (completedSteps / 5) * 100;
                  
                  console.log('🔍 Progress debug:', {
                    currentStepIndex,
                    completedSteps,
                    progress,
                    status: campaign.status
                  });
                  
                  console.log('🔍 Progress calculation:', {
                    status: campaign.status,
                    currentStep,
                    currentStepIndex,
                    totalSteps,
                    progress
                  });
                  
                  return progress;
                })()}%)` 
              }}
            ></div>

            {/* Steps */}
            <div className="relative grid grid-cols-5 gap-0 px-4">
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
                          ? isCurrentStepDelayed()
                            ? 'bg-red-500 border-red-500 shadow-lg shadow-red-500/25 animate-pulse'
                            : 'bg-dark-surface border-dark-accent shadow-lg shadow-dark-accent/25 animate-pulse'
                          : 'bg-dark-surface border-dark-border hover:border-dark-accent/50'
                      }`}
                    >
                      {status === 'completed' ? (
                        <Check size={10} className="text-white" />
                      ) : status === 'current' ? (
                        isCurrentStepDelayed() ? (
                          <AlertCircle size={10} className="text-white" />
                        ) : (
                          <Clock size={10} className="text-dark-accent" />
                        )
                      ) : null
                      }
                    </button>

                    {/* Step Label */}
                    <div className="mt-2 text-center w-full">
                      <h3 className={`font-medium text-xs leading-tight break-words ${
                        status === 'completed' 
                          ? 'text-dark-text'
                          : 'text-dark-text-secondary'
                      }`}>
                        {step.title}
                      </h3>
                      
                      {/* Date display for completed and current steps */}
                      {step.dateField && campaign.schedules[step.dateField] && (
                        <div className="text-xs text-dark-text-secondary mt-1 hidden md:block">
                          {formatDate(campaign.schedules[step.dateField])}
                        </div>
                      )}
                      
                      {/* Current step indicator */}
                      {status === 'current' && (
                        <div className="mt-1">
                          <div className="text-xs text-dark-accent font-medium">Now</div>
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
                <span>期限: {campaign.schedules[selectedStep.dateField]}</span>
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