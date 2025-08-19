'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

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
      placeholder: '個人名または法人名を入力してください'
    },
    {
      title: '連絡可能なメールアドレス',
      field: 'email',
      type: 'email',
      placeholder: 'example@email.com'
    },
    {
      title: '報酬額（税別）',
      field: 'price',
      type: 'number',
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
      ]
    }
  ];

  const handleInputChange = (field: keyof SurveyData, value: string) => {
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

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const canProceed = surveyData[currentStepData.field as keyof SurveyData] !== '';

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
            <input
              type="date"
              value={surveyData[currentStepData.field as keyof SurveyData] as string}
              onChange={(e) => handleInputChange(currentStepData.field as keyof SurveyData, e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          ) : (
            <input
              type={currentStepData.type}
              placeholder={currentStepData.placeholder}
              value={surveyData[currentStepData.field as keyof SurveyData] as string}
              onChange={(e) => handleInputChange(currentStepData.field as keyof SurveyData, e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
    </div>
  );
}
