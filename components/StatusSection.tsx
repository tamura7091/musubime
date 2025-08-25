'use client';

import React, { useState } from 'react';
import { Campaign, getStepFromStatus, getStepOrder, getStepLabel, CampaignStep, CampaignStatus } from '../types';
import Tooltip from './Tooltip';
import { Check, Clock, Link as LinkIcon, Calendar, ChevronRight, AlertCircle } from 'lucide-react';
import { useDesignSystem } from '@/hooks/useDesignSystem';

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
  const ds = useDesignSystem();
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
    
    // Handle empty strings
    if (typeof date === 'string' && date.trim() === '') return null;
    
    try {
      const dateObj = new Date(date);
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) return null;
      
      return new Intl.DateTimeFormat('ja-JP', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
      }).format(dateObj);
    } catch (error) {
      console.warn('Invalid date value:', date);
      return null;
    }
  };

  // Calculate days until a specific date
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

  // Get next-step date based on current status
  const getNextStepDate = (): string | null | undefined => {
    const status = campaign.status as CampaignStatus;
    
    switch (status) {
      case 'not_started':
      case 'meeting_scheduling':
      case 'meeting_scheduled':
      case 'plan_creating':
      case 'plan_revising':
        return campaign?.schedules?.planSubmissionDate;
      case 'plan_submitted':
      case 'draft_creating':
      case 'draft_revising':
        return campaign?.schedules?.draftSubmissionDate;
      case 'draft_submitted':
      case 'scheduling':
      case 'scheduled':
      case 'payment_processing':
        return campaign?.schedules?.liveDate;
      default:
        return campaign?.schedules?.liveDate;
    }
  };

  // Check if current step is due today
  const isCurrentStepDueToday = () => {
    const nextStepDate = getNextStepDate();
    const daysUntil = getDaysUntil(nextStepDate);
    return daysUntil === 0;
  };

  // Check if current step is behind schedule
  const isCurrentStepBehindSchedule = () => {
    if (campaign.status === 'completed') return false;
    const nextStepDate = getNextStepDate();
    const daysUntil = getDaysUntil(nextStepDate);
    return daysUntil !== null && daysUntil < 0;
  };

  // Whether influencer action is required right now
  const isActionRequiredNow = () => {
    const s = campaign.status as CampaignStatus;
    const requiring: CampaignStatus[] = [
      'meeting_scheduling',
      'meeting_scheduled',
      'plan_creating',
      'plan_revising',
      'draft_creating',
      'draft_revising',
      'scheduling',
      // For 'scheduled' the next action is payment; keep default visuals
    ];
    return requiring.includes(s);
  };

  // Check if action is overdue (more than 1 day past due) - legacy function for compatibility
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



      {/* Campaign Flow */}
              <div className="rounded-xl p-4 sm:p-6" style={{ 
          backgroundColor: ds.bg.card,
          borderColor: ds.border.primary,
          borderWidth: '1px',
          borderStyle: 'solid'
        }}>
        <h3 className="font-semibold mb-4" style={{ color: ds.text.primary, fontSize: ds.typography.heading.h2.fontSize, lineHeight: ds.typography.heading.h2.lineHeight }}>
          PRの流れとステータス
        </h3>
        
        {/* Flow visualization */}
        <div className="relative">
          <div className="w-full">
            {/* Connection line */}
            <div className="absolute top-2 left-4 right-4 h-0.5" style={{ backgroundColor: ds.border.secondary }}></div>
            <div 
              className="absolute top-2 left-4 h-0.5 transition-all duration-500"
              style={{ 
                backgroundColor: (isActionRequiredNow() && isCurrentStepBehindSchedule()) 
                  ? '#ef4444' // Red if behind schedule
                  : (isActionRequiredNow() && isCurrentStepDueToday())
                  ? '#eab308' // Yellow if due today
                  : ds.button.primary.bg, // Default blue
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
                    className="relative w-4 h-4 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 z-10"
                    style={{
                      backgroundColor: ((isActionRequiredNow() && isCurrentStepBehindSchedule()) && index <= currentStepIndex)
                        ? '#ef4444'
                        : ((isActionRequiredNow() && isCurrentStepDueToday()) && index <= currentStepIndex)
                        ? '#eab308'
                        : (status === 'completed' 
                          ? ds.button.primary.bg
                          : status === 'current'
                          ? ds.bg.card
                          : ds.bg.card),
                      borderColor: ((isActionRequiredNow() && isCurrentStepBehindSchedule()) && index <= currentStepIndex)
                        ? '#ef4444'
                        : ((isActionRequiredNow() && isCurrentStepDueToday()) && index <= currentStepIndex)
                        ? '#eab308'
                        : (status === 'completed' 
                          ? ds.button.primary.bg
                          : status === 'current'
                          ? ds.button.primary.bg
                          : ds.border.secondary),
                      boxShadow: ((isActionRequiredNow() && isCurrentStepBehindSchedule()) && index <= currentStepIndex)
                        ? '0 10px 15px -3px #ef444440'
                        : ((isActionRequiredNow() && isCurrentStepDueToday()) && index <= currentStepIndex)
                        ? '0 10px 15px -3px #eab30840'
                        : (status === 'completed' 
                          ? `0 10px 15px -3px ${ds.button.primary.bg}40`
                          : status === 'current'
                          ? `0 10px 15px -3px ${ds.button.primary.bg}40`
                          : 'none')
                    }}
                    >
                      {((isActionRequiredNow() && isCurrentStepBehindSchedule()) && index <= currentStepIndex) ? (
                        index < currentStepIndex ? (
                          <Check size={10} style={{ color: '#ffffff' }} />
                        ) : (
                          <AlertCircle size={10} style={{ color: '#ffffff' }} />
                        )
                      ) : (((isActionRequiredNow() && isCurrentStepDueToday()) && index <= currentStepIndex)) ? (
                        index < currentStepIndex ? (
                          <Check size={10} style={{ color: '#ffffff' }} />
                        ) : (
                          <Clock size={10} style={{ color: '#ffffff' }} />
                        )
                      ) : status === 'completed' ? (
                        <Check size={10} style={{ color: ds.button.primary.text }} />
                      ) : status === 'current' ? (
                        <Clock size={10} style={{ color: ds.button.primary.bg }} />
                      ) : null
                      }
                    </button>

                    {/* Step Label */}
                    <div className="mt-2 text-center w-full">
                      <h3 className="font-medium text-xs leading-tight break-words" style={{
                        color: status === 'completed' 
                          ? ds.text.primary
                          : ds.text.secondary
                      }}>
                        {step.title}
                      </h3>
                      
                      {/* Date display for completed and current steps */}
                      {step.dateField && campaign.schedules[step.dateField] && (
                        <div className="text-xs mt-1 hidden md:block" style={{ color: ds.text.secondary }}>
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