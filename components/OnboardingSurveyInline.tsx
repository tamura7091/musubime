'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Calendar } from 'lucide-react';
import { useDesignSystem } from '@/hooks/useDesignSystem';
import DatePicker from './DatePicker';
import Modal from './Modal';

interface OnboardingSurveyInlineProps {
  campaignId: string;
  onComplete: () => void;
  embedded?: boolean;
  defaultPrice?: number | string;
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

export default function OnboardingSurveyInline({ campaignId, onComplete, embedded = false, defaultPrice }: OnboardingSurveyInlineProps) {
  const ds = useDesignSystem();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDateConfirmation, setShowDateConfirmation] = useState(false);
  const [pendingDateValue, setPendingDateValue] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
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

  // Price is no longer prefilled and does not show confirmation on edits
  const computedPricePlaceholder = (() => {
    if (defaultPrice === undefined || defaultPrice === null) return '50000';
    const numeric = Number(String(defaultPrice).replace(/[^0-9.-]/g, ''));
    if (!Number.isFinite(numeric) || numeric <= 0) return '50000';
    return String(Math.round(numeric));
  })();

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
      placeholder: '個人名または法人名を入力してください',
      description: '契約される個人名または法人名をご記入ください'
    },
    {
      title: '連絡可能なメールアドレス',
      field: 'email',
      type: 'email',
      placeholder: 'example@email.com',
      description: 'こちらのメールアドレスにオンライン契約をお送りします'
    },
    {
      title: 'メールで同意した報酬額（税別）',
      field: 'price',
      type: 'text',
      placeholder: computedPricePlaceholder,
      description: '税抜きで記入してください。'
    },
    {
      title: 'PRアップロード日',
      field: 'uploadDate',
      type: 'date',
      description: '1月キャンペーンのPRをされるかたは1/1~1/4のみを選択してください。（一部例外を除く）'
    },
    {
      title: '初稿提出日',
      field: 'draftSubmissionDate',
      type: 'date',
      description: '初稿とは書類上の構成案ではなく編集済みのコンテンツを指します。'
    },
    {
      title: '構成案の提出日',
      field: 'planSubmissionDate',
      type: 'date',
      description: '構成案とはテンプレートに沿って作成された書面上のコンテンツプランを指します。'
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
      // Digits only and format with commas
      const digitsOnly = value.replace(/\D/g, '');
      const withCommas = digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      setSurveyData(prev => ({ ...prev, price: withCommas }));
      return;
    }

    if (field === 'uploadDate' && value) {
      // Check if the selected date is one of the allowed dates for 2026 campaign
      const allowedDates = ['2026-01-01', '2026-01-02', '2026-01-03'];
      if (!allowedDates.includes(value)) {
        setPendingDateValue(value);
        setShowDateConfirmation(true);
        return;
      }
    }

    // Email validation
    if (field === 'email') {
      if (value && !isValidEmail(value)) {
        setEmailError('正しいメールアドレス形式で入力してください');
      } else {
        setEmailError('');
      }
    }

    setSurveyData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleDateConfirmation = () => {
    setSurveyData(prev => ({ ...prev, uploadDate: pendingDateValue }));
    setShowDateConfirmation(false);
    setPendingDateValue('');
  };

  const handleDateCancellation = () => {
    setShowDateConfirmation(false);
    setPendingDateValue('');
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

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const currentValue = surveyData[currentStepData.field as keyof SurveyData];
  const canProceed = currentValue !== '' && (currentStepData.field !== 'email' || (isValidEmail(currentValue) && !emailError));

  const handleEnterKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (isLastStep) {
      if (canProceed && !isSubmitting) handleSubmit();
    } else {
      if (canProceed) handleNext();
    }
  };

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
            onKeyDown={handleEnterKey}
            style={{
              backgroundColor: ds.form.input.bg,
              borderColor: ds.form.input.border,
              color: ds.text.primary,
              borderWidth: '1px',
              borderStyle: 'solid',
              outline: 'none',
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
          <div onKeyDown={handleEnterKey}>
            <DatePicker
              value={surveyData[currentStepData.field as keyof SurveyData] as string}
              onChange={(val) => handleInputChange(currentStepData.field as keyof SurveyData, val)}
            />
          </div>
        ) : (
          <div>
            <input
              type={currentStepData.type}
              placeholder={currentStepData.placeholder}
              value={surveyData[currentStepData.field as keyof SurveyData] as string}
              onChange={(e) => handleInputChange(currentStepData.field as keyof SurveyData, e.target.value)}
              onKeyDown={handleEnterKey}
              style={{
                backgroundColor: ds.form.input.bg,
                borderColor: currentStepData.field === 'email' && emailError ? '#ef4444' : ds.form.input.border,
                color: ds.text.primary,
                borderWidth: '1px',
                borderStyle: 'solid',
                outline: 'none',
              }}
              className="w-full p-3 rounded-lg focus:ring-2 focus:border-transparent"
              onFocus={(e) => {
                e.target.style.borderColor = ds.form.input.focus.ring;
                e.target.style.boxShadow = `0 0 0 2px ${ds.form.input.focus.ring}`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = currentStepData.field === 'email' && emailError ? '#ef4444' : ds.form.input.border;
                e.target.style.boxShadow = 'none';
              }}
            />
            {currentStepData.field === 'price' && (
              <>
                <div className="mt-2 text-xs" style={{ color: ds.text.secondary }}>
                  {(() => {
                    const raw = (surveyData.price || '').replace(/,/g, '');
                    const num = raw ? parseInt(raw, 10) : 0;
                    const taxIncluded = Math.round(num * 1.1);
                    return `税込 (10%): ¥${taxIncluded.toLocaleString('ja-JP')}`;
                  })()}
                </div>
              </>
            )}
            {currentStepData.field === 'email' && emailError && (
              <p className="text-red-500 text-sm mt-1">{emailError}</p>
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

      {/* Date Confirmation Modal */}
      <Modal
        isOpen={showDateConfirmation}
        onClose={handleDateCancellation}
        title="日付確認"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: ds.text.secondary }}>
            2026年1月キャンペーンでのPRをされる方は1/1~1/3をご選択ください。メール等で例外の日付を同意している場合や該当しない場合はOKを押してください
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleDateCancellation}
              className="px-4 py-2 text-sm border rounded-lg transition-colors"
              style={{
                borderColor: ds.border.primary,
                color: ds.text.secondary,
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = ds.button.secondary.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              キャンセル
            </button>
            <button
              onClick={handleDateConfirmation}
              className="px-4 py-2 text-sm rounded-lg transition-colors"
              style={{
                backgroundColor: ds.button.primary.bg,
                color: ds.button.primary.text
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = ds.button.primary.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = ds.button.primary.bg;
              }}
            >
              OK
            </button>
          </div>
        </div>
      </Modal>
      {/* Price edit warning removed per requirements */}
    </div>
  );
}
