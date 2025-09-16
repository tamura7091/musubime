'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import DatePicker from './DatePicker';
import Modal from './Modal';

interface OnboardingSurveyProps {
  campaignId: string;
  onComplete: () => void;
  onCancel: () => void;
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

export default function OnboardingSurvey({ campaignId, onComplete, onCancel }: OnboardingSurveyProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    repurposable: 'no'
  });

  const steps = [
    {
      title: 'PRを行うプラットフォーム',
      field: 'platform',
      type: 'select',
      options: [
        { value: 'youtube_long', label: 'YouTube長編' },
        { value: 'youtube_short', label: 'YouTubeショート' },
        { value: 'instagram_reel', label: 'Instagramリール' },
        { value: 'tiktok', label: 'TikTok' },
        { value: 'x_twitter', label: 'X (Twitter)' },
        { value: 'podcast', label: 'ポッドキャスト' },
        { value: 'blog', label: 'ブログ' }
      ]
    },
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
      title: '報酬額（税別）',
      field: 'price',
      type: 'number',
      placeholder: '50000',
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

    setSurveyData(prev => ({
      ...prev,
      [field]: value
    }));
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
        console.error('Failed to submit survey');
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">基本情報入力</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>ステップ {currentStep + 1} / {steps.length}</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Current Step */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {currentStepData.title}
          </h3>

          {currentStepData.type === 'select' ? (
            <select
              value={surveyData[currentStepData.field as keyof SurveyData] as string}
              onChange={(e) => handleInputChange(currentStepData.field as keyof SurveyData, e.target.value)}
              onKeyDown={handleEnterKey}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <>
              <input
                type={currentStepData.type}
                placeholder={currentStepData.placeholder}
                value={surveyData[currentStepData.field as keyof SurveyData] as string}
                onChange={(e) => handleInputChange(currentStepData.field as keyof SurveyData, e.target.value)}
                onKeyDown={handleEnterKey}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  currentStepData.field === 'email' && emailError ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {currentStepData.field === 'email' && emailError && (
                <p className="text-red-500 text-sm mt-1">{emailError}</p>
              )}
            </>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
            前へ
          </button>

          {isLastStep ? (
            <button
              onClick={handleSubmit}
              disabled={!canProceed || isSubmitting}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              次へ
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Date Confirmation Modal */}
      <Modal
        isOpen={showDateConfirmation}
        onClose={handleDateCancellation}
        title="日付確認"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'rgb(107, 114, 128)' }}>
            2026年1月キャンペーンでのPRをされる方は1/1~1/3をご選択ください。メール等で例外の日付を同意している場合や該当しない場合はOKを押してください
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleDateCancellation}
              className="px-4 py-2 text-sm border rounded-lg transition-colors"
              style={{
                borderColor: '#d1d5db',
                color: '#6b7280',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
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
                backgroundColor: '#2563eb',
                color: '#ffffff'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1d4ed8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
            >
              OK
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
