'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Calendar } from 'lucide-react';
import { useDesignSystem } from '@/hooks/useDesignSystem';
import DatePicker from './DatePicker'

interface OnboardingSurveyInlineProps {
  campaignId: string;
  onComplete: () => void;
  embedded?: boolean;
}

interface SurveyData {
  platform: string;
  contractName: string;
  email: string;
  price: string;
  uploadDate: string;
  planSubmissionDate: string;
  draftSubmissionDate: string;
  repurposable: 'yes' | 'no';
}

export default function OnboardingSurveyInline({ campaignId, onComplete, embedded = false }: OnboardingSurveyInlineProps) {
  const ds = useDesignSystem();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [surveyData, setSurveyData] = useState<SurveyData>({
    platform: '',
    contractName: '',
    email: '',
    price: '',
    uploadDate: '',
    planSubmissionDate: '',
    draftSubmissionDate: '',
    repurposable: 'yes'
  });

  const steps: Array<{
    title: string;
    field: keyof SurveyData;
    type: 'text' | 'email' | 'number' | 'date' | 'select';
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
    description?: string;
  }> = [
    {
      title: '契約書用の名前',
      field: 'contractName',
      type: 'text',
      placeholder: '個人名または法人名を入力してください'
    },
    {
      title: '連絡可能なメールアドレス',
      field: 'email',
      type: 'email',
      placeholder: 'example@email.com'
    },
    {
      title: 'メールで同意した報酬額（税別）',
      field: 'price',
      type: 'text',
      placeholder: '50000'
    },
    {
      title: 'PRアップロード日',
      field: 'uploadDate',
      type: 'date'
    },
    {
      title: '構成案の提出日',
      field: 'planSubmissionDate',
      type: 'date'
    },
    {
      title: '初稿提出日',
      field: 'draftSubmissionDate',
      type: 'date'
    },
    {
      title: '二次利用の可否',
      field: 'repurposable',
      type: 'select',
      options: [
        { value: 'yes', label: '可' },
        { value: 'no', label: '不可' }
      ],
      description: '制作いただいたPRを弊社の広告や公式SNSで使用してもよろしいでしょうか？制作いただいたPR投稿をそのままブーストするため認知拡大におすすめです。'
    }
  ];

  const handleInputChange = (field: keyof SurveyData, value: string) => {
    if (field === 'price') {
      // Keep only digits
      const digitsOnly = value.replace(/\D/g, '');
      // Format with commas
      const withCommas = digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      setSurveyData(prev => ({ ...prev, price: withCommas }));
      return;
    }
    setSurveyData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/campaigns/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId,
          ...surveyData
        }),
      });

      if (response.ok) {
        onComplete();
      } else {
        let message = 'Failed to submit survey';
        try {
          const data = await response.json();
          message = data?.message || data?.error || message;
        } catch {}
        console.error('Failed to submit survey:', message);
        setErrorMessage(message);
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      setErrorMessage('サーバーエラーが発生しました。しばらくしてから再度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const canProceed = surveyData[currentStepData.field as keyof SurveyData] !== '';

  return (
    <div
      style={embedded ? undefined : { backgroundColor: ds.bg.card, borderColor: ds.border.primary }}
      className={embedded ? "pt-2" : "border rounded-lg p-4"}
    >
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2" style={{ 
          color: ds.text.secondary 
        }}>
          <span>ステップ {currentStep + 1} / {steps.length}</span>
          <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
        </div>
        <div className="w-full rounded-full h-2" style={{ 
          backgroundColor: ds.progress.bg 
        }}>
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${((currentStep + 1) / steps.length) * 100}%`,
              backgroundColor: ds.progress.fill
            }}
          ></div>
        </div>
      </div>

      {/* Current Step */}
      <div className="mb-4">
        {errorMessage && (
          <div className="mb-3 p-3 rounded text-sm" style={{ backgroundColor: '#ef4444' + '10', color: '#f87171', border: '1px solid ' + '#ef4444' + '30' }}>
            {errorMessage}
          </div>
        )}
        <h3 className="text-lg font-medium mb-3" style={{ 
          color: ds.text.primary 
        }}>
          {currentStepData.title}
        </h3>
        
        {currentStepData.description && (
          <p className="text-sm mb-3" style={{ 
            color: ds.text.secondary 
          }}>
            {currentStepData.description}
          </p>
        )}

        {currentStepData.type === 'select' ? (
          <select
            value={surveyData[currentStepData.field as keyof SurveyData] as string}
            onChange={(e) => handleInputChange(currentStepData.field as keyof SurveyData, e.target.value)}
            style={{
              backgroundColor: ds.form.input.bg,
              borderColor: ds.form.input.border,
              color: ds.text.primary,
            }}
            className="w-full p-3 rounded-lg focus:ring-2 focus:border-transparent"
            onFocus={(e) => {
              e.target.style.borderColor = ds.form.input.focus.ring;
              e.target.style.boxShadow = `0 0 0 2px ${ds.form.input.focus.ring}`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = ds.form.input.border;
              e.target.style.boxShadow = 'none';
            }}
          >
            <option value="">選択してください</option>
            {currentStepData.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : currentStepData.type === 'date' ? (
          <DatePicker
            value={surveyData[currentStepData.field as keyof SurveyData] as string}
            onChange={(val) => handleInputChange(currentStepData.field as keyof SurveyData, val)}
          />
        ) : (
          <div>
            <input
              type={currentStepData.type}
              placeholder={currentStepData.placeholder}
              value={surveyData[currentStepData.field as keyof SurveyData] as string}
              onChange={(e) => handleInputChange(currentStepData.field as keyof SurveyData, e.target.value)}
              style={{
                backgroundColor: ds.form.input.bg,
                borderColor: ds.form.input.border,
                color: ds.text.primary,
              }}
              className="w-full p-3 rounded-lg focus:ring-2 focus:border-transparent"
              onFocus={(e) => {
                e.target.style.borderColor = ds.form.input.focus.ring;
                e.target.style.boxShadow = `0 0 0 2px ${ds.form.input.focus.ring}`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = ds.form.input.border;
                e.target.style.boxShadow = 'none';
              }}
            />
            {currentStepData.field === 'price' && (
              <div className="mt-2 text-xs" style={{ color: ds.text.secondary }}>
                {(() => {
                  const raw = (surveyData.price || '').replace(/,/g, '');
                  const num = raw ? parseInt(raw, 10) : 0;
                  const taxIncluded = Math.round(num * 1.1);
                  return `税込 (10%): ¥${taxIncluded.toLocaleString('ja-JP')}`;
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          style={{
            color: ds.button.secondary.text,
          }}
          className="flex items-center px-4 py-2 hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = ds.button.secondary.hover;
              e.currentTarget.style.color = ds.text.primary;
            }
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = ds.button.secondary.text;
            }
          }}
        >
          <ChevronLeft size={20} />
          前へ
        </button>

        {isLastStep ? (
          <button
            onClick={handleSubmit}
            disabled={!canProceed || isSubmitting}
            style={{
              backgroundColor: ds.button.primary.bg,
              color: ds.button.primary.text,
            }}
            className="flex items-center px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = ds.button.primary.hover;
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = ds.button.primary.bg;
              }
            }}
          >
            {isSubmitting ? (
              '送信中...'
            ) : (
              <>
                <Check size={20} className="mr-2" />
                完了
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!canProceed}
            style={{
              backgroundColor: ds.button.primary.bg,
              color: ds.button.primary.text,
            }}
            className="flex items-center px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = ds.button.primary.hover;
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = ds.button.primary.bg;
              }
            }}
          >
            次へ
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
