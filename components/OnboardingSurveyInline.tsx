'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Calendar } from 'lucide-react';
import { useDesignSystem } from '@/hooks/useDesignSystem';
import DatePicker from './DatePicker';
import { getPlatformLabel } from '@/lib/platform';
import Modal from './Modal';
import MultiItemInput from './MultiItemInput';

interface CampaignInfo {
  id: string;
  platform: string;
  defaultPrice?: number | string;
}

interface OnboardingSurveyInlineProps {
  campaignId?: string; // Deprecated: use campaigns instead
  campaigns?: CampaignInfo[]; // New: array of campaigns for multi-platform support
  onComplete: () => void;
  embedded?: boolean;
  defaultPrice?: number | string; // Deprecated: use campaigns array instead
  hasPreviousCampaigns?: boolean;
  defaultUploadDate?: string; // For long-term contracts, prefill with date_live
  // Modal mode props
  onCancel?: () => void;
  isModal?: boolean;
}

interface SurveyData {
  platform: string;
  contractName: string;
  email: string;
  price: string;
  platformPrices: { [campaignId: string]: string }; // For multi-platform campaigns, keyed by campaign ID
  useBulkPrice: boolean; // Whether to use single bulk price instead of per-platform
  bulkPrice: string; // Single price to split across platforms
  uploadDate: string;
  planSubmissionDate: string;
  draftSubmissionDate: string;
  repurposable: 'yes' | 'no';
}

export default function OnboardingSurveyInline({ campaignId, campaigns, onComplete, embedded = false, defaultPrice, hasPreviousCampaigns = false, defaultUploadDate, onCancel, isModal = false }: OnboardingSurveyInlineProps) {
  const ds = useDesignSystem();
  
  // Support both old single campaign and new multi-campaign interface
  const activeCampaigns = campaigns || (campaignId ? [{ id: campaignId, platform: '', defaultPrice }] : []);
  const isMultiPlatform = activeCampaigns.length > 1;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDateConfirmation, setShowDateConfirmation] = useState(false);
  const [dateConfirmationShown, setDateConfirmationShown] = useState(false); // Track if confirmation has been shown
  const [pendingDateValue, setPendingDateValue] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [pendingUploadDate, setPendingUploadDate] = useState<string>(''); // Track unfilled date input
  
  // Initialize platform prices for multi-platform campaigns
  // Use campaign.id as key to avoid conflicts when same platform appears multiple times
  const initialPlatformPrices: { [campaignId: string]: string } = {};
  activeCampaigns.forEach(campaign => {
    initialPlatformPrices[campaign.id] = '';
  });
  
  const [surveyData, setSurveyData] = useState<SurveyData>({
    platform: '',
    contractName: '',
    email: '',
    price: '',
    platformPrices: initialPlatformPrices,
    useBulkPrice: true, // Default to bulk pricing
    bulkPrice: '',
    uploadDate: defaultUploadDate || '',
    planSubmissionDate: '',
    draftSubmissionDate: '',
    repurposable: 'yes'
  });

  // getPlatformLabel imported from shared utility

  // Price is no longer prefilled and does not show confirmation on edits
  const computedPricePlaceholder = (() => {
    if (defaultPrice === undefined || defaultPrice === null) return '50000';
    const numeric = Number(String(defaultPrice).replace(/[^0-9.-]/g, ''));
    if (!Number.isFinite(numeric) || numeric <= 0) return '50000';
    return String(Math.round(numeric));
  })();

  const allSteps: Array<{
    title: string;
    field: keyof SurveyData;
    type: 'text' | 'email' | 'number' | 'date' | 'select' | 'multi-date' | 'multi-platform-price';
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
      title: '契約書をお送りするメールアドレス',
      field: 'email',
      type: 'email',
      placeholder: 'example@email.com',
      description: 'こちらのメールアドレスにオンライン契約をお送りします'
    },
    // Price step - different for single vs multi-platform
    isMultiPlatform ? {
      title: '報酬額（税別）',
      field: 'platformPrices' as keyof SurveyData,
      type: 'multi-platform-price' as const,
      description: '税抜きで記入してください。プラットフォームごとに異なる報酬額の場合は下記のチェックボックスを外してください。'
    } : {
      title: 'メールで同意した報酬額（税別）',
      field: 'price',
      type: 'text',
      placeholder: `${computedPricePlaceholder}（税込: ¥${(() => { const n = Number(String(computedPricePlaceholder).replace(/[^0-9.-]/g, '')); return Number.isFinite(n) ? Math.round(n * 1.1).toLocaleString('ja-JP') : '' })()}）`,
      description: '税抜きで記入してください。'
    },
    {
      title: 'PRアップロード日',
      field: 'uploadDate',
      type: 'multi-date',
      description: '投稿予定日を入力してください。ポッドキャストなど複数回に分けて投稿する場合は「複数の投稿日を追加」ボタンで追加できます。'
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

  // Skip contractName and email steps if influencer has previous campaigns
  const steps = hasPreviousCampaigns
    ? allSteps.filter(step => step.field !== 'contractName' && step.field !== 'email')
    : allSteps;

  const handleInputChange = (field: keyof SurveyData, value: string, platform?: string) => {
    if (field === 'price') {
      // Digits only and format with commas
      const digitsOnly = value.replace(/\D/g, '');
      const withCommas = digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      setSurveyData(prev => ({ ...prev, price: withCommas }));
      return;
    }

    if (field === 'bulkPrice') {
      // Handle bulk price input
      const digitsOnly = value.replace(/\D/g, '');
      const withCommas = digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      setSurveyData(prev => ({ ...prev, bulkPrice: withCommas }));
      return;
    }

    if (field === 'platformPrices' && platform) {
      // Handle campaign-specific price input (platform param is actually campaign ID here)
      const digitsOnly = value.replace(/\D/g, '');
      const withCommas = digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      setSurveyData(prev => ({
        ...prev,
        platformPrices: {
          ...prev.platformPrices,
          [platform]: withCommas // platform is actually campaign.id
        }
      }));
      return;
    }

    if (field === 'uploadDate' && value && !dateConfirmationShown) {
      // Check if the selected date is one of the allowed dates for 2026 campaign
      const allowedDates = ['2026-01-01', '2026-01-02', '2026-01-03'];
      if (!allowedDates.includes(value)) {
        setPendingDateValue(value);
        setShowDateConfirmation(true);
        setDateConfirmationShown(true); // Mark as shown
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
    // If on multi-date step and there's a pending value, add it first
    if (currentStepData.type === 'multi-date' && currentStepData.field === 'uploadDate' && pendingUploadDate.trim()) {
      const existingDates = surveyData.uploadDate ? surveyData.uploadDate.split(',').map(d => d.trim()).filter(Boolean) : [];
      const updatedDates = [...existingDates, pendingUploadDate.trim()];
      setSurveyData(prev => ({ ...prev, uploadDate: updatedDates.join(',') }));
      setPendingUploadDate('');
    }
    
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
    
    // If there's a pending upload date, add it before submitting
    let finalSurveyData = { ...surveyData };
    if (pendingUploadDate.trim()) {
      const existingDates = surveyData.uploadDate ? surveyData.uploadDate.split(',').map(d => d.trim()).filter(Boolean) : [];
      const updatedDates = [...existingDates, pendingUploadDate.trim()];
      finalSurveyData.uploadDate = updatedDates.join(',');
    }
    
    try {
      if (isMultiPlatform) {
        // Submit data for each campaign separately with platform-specific prices
        const submissions = activeCampaigns.map(campaign => {
          let priceForPlatform: string;
          
          if (finalSurveyData.useBulkPrice) {
            // Split bulk price equally across all campaigns
            const bulkPriceNum = parseInt(finalSurveyData.bulkPrice.replace(/,/g, ''), 10) || 0;
            const splitPrice = Math.round(bulkPriceNum / activeCampaigns.length);
            priceForPlatform = splitPrice.toString();
          } else {
            // Use individual campaign price (remove commas for API)
            const priceWithCommas = finalSurveyData.platformPrices[campaign.id] || '';
            priceForPlatform = priceWithCommas.replace(/,/g, '');
          }
          
          return fetch('/api/campaigns/onboarding', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              campaignId: campaign.id,
              contractName: finalSurveyData.contractName,
              email: finalSurveyData.email,
              price: priceForPlatform,
              uploadDate: finalSurveyData.uploadDate,
              planSubmissionDate: finalSurveyData.planSubmissionDate,
              draftSubmissionDate: finalSurveyData.draftSubmissionDate,
              repurposable: finalSurveyData.repurposable
            }),
          });
        });

        const responses = await Promise.all(submissions);
        const allSuccessful = responses.every(r => r.ok);
        
        if (allSuccessful) {
          onComplete();
        } else {
          const failedResponses = responses.filter(r => !r.ok);
          let message = `${failedResponses.length}件のキャンペーンの更新に失敗しました`;
          try {
            const data = await failedResponses[0].json();
            message = data?.message || data?.error || message;
          } catch {}
          console.error('Failed to submit survey:', message);
          setErrorMessage(message);
        }
      } else {
        // Single campaign - use the old behavior
      const response = await fetch('/api/campaigns/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            campaignId: activeCampaigns[0]?.id || campaignId,
          ...finalSurveyData
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
  
  // For multi-date fields, also check if there's a pending value in the input
  const effectiveValue = currentStepData.type === 'multi-date' && currentStepData.field === 'uploadDate'
    ? (currentValue || pendingUploadDate)
    : currentValue;
  
  // For multi-platform price, check bulk price OR all individual prices
  const canProceedMultiPlatformPrice = currentStepData.type === 'multi-platform-price' 
    ? (surveyData.useBulkPrice 
        ? surveyData.bulkPrice && surveyData.bulkPrice.trim() !== ''
        : activeCampaigns.every(campaign => {
            const price = surveyData.platformPrices[campaign.id];
            return price && price.trim() !== '';
          })
      )
    : true;
  
  const canProceed = (
    (currentStepData.type === 'multi-platform-price' ? canProceedMultiPlatformPrice : effectiveValue !== '') &&
    (currentStepData.field !== 'email' || (typeof currentValue === 'string' && isValidEmail(currentValue) && !emailError))
  );

  const handleEnterKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (isLastStep) {
      if (canProceed && !isSubmitting) handleSubmit();
    } else {
      if (canProceed) handleNext();
    }
  };

  const content = (
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

        {currentStepData.type === 'multi-platform-price' ? (
          <div className="space-y-4">
            {/* Checkbox for separate platform pricing option */}
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!surveyData.useBulkPrice}
                  onChange={(e) => setSurveyData(prev => ({ ...prev, useBulkPrice: !e.target.checked }))}
                  className="w-4 h-4 rounded"
                  style={{
                    accentColor: ds.button.primary.bg
                  }}
                />
                <span className="text-sm" style={{ color: ds.text.primary }}>
                  各プラットフォームごとに異なる報酬額で契約した
                </span>
              </label>
            </div>

            {surveyData.useBulkPrice ? (
              /* Bulk price input */
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: ds.text.primary }}>
                  報酬額（税別）
                </label>
                <input
                  type="text"
                  placeholder="100000（税込: ¥110,000）"
                  value={surveyData.bulkPrice}
                  onChange={(e) => handleInputChange('bulkPrice', e.target.value)}
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
                />
                <div className="mt-2 text-xs" style={{ color: ds.text.secondary }}>
                  {(() => {
                    const raw = surveyData.bulkPrice.replace(/,/g, '');
                    const num = raw ? parseInt(raw, 10) : 0;
                    const taxIncluded = Math.round(num * 1.1);
                    return `税込 (10%): ¥${taxIncluded.toLocaleString('ja-JP')}`;
                  })()}
                </div>
              </div>
            ) : (
              /* Individual platform price inputs */
              <>
                {activeCampaigns.map((campaign, index) => {
                  const price = surveyData.platformPrices[campaign.id] || '';
                  const platformLabel = getPlatformLabel(campaign.platform);
                  const defaultPlatformPrice = campaign.defaultPrice || '50000';
                  const numericDefault = Number(String(defaultPlatformPrice).replace(/[^0-9.-]/g, ''));
                  const placeholder = Number.isFinite(numericDefault) && numericDefault > 0 
                    ? `${Math.round(numericDefault)}（税込: ¥${Math.round(numericDefault * 1.1).toLocaleString('ja-JP')}）`
                    : '50000（税込: ¥55,000）';
                  
                  return (
                    <div key={campaign.id}>
                      <label className="block text-sm font-medium mb-2" style={{ color: ds.text.primary }}>
                        {platformLabel} {activeCampaigns.filter(c => getPlatformLabel(c.platform) === platformLabel).length > 1 ? `(${index + 1})` : ''}
                      </label>
                      <input
                        type="text"
                        placeholder={placeholder}
                        value={price}
                        onChange={(e) => handleInputChange('platformPrices', e.target.value, campaign.id)}
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
                      />
                      <div className="mt-2 text-xs" style={{ color: ds.text.secondary }}>
                        {(() => {
                          const raw = price.replace(/,/g, '');
                          const num = raw ? parseInt(raw, 10) : 0;
                          const taxIncluded = Math.round(num * 1.1);
                          return `税込 (10%): ¥${taxIncluded.toLocaleString('ja-JP')}`;
                        })()}
                      </div>
                    </div>
                  );
                })}
                {/* Sum display for individual prices */}
                <div className="pt-3 mt-3 border-t" style={{ borderColor: ds.border.primary }}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium" style={{ color: ds.text.primary }}>合計金額（税別）</span>
                    <span className="text-lg font-semibold" style={{ color: ds.text.accent }}>
                      {(() => {
                        const sum = activeCampaigns.reduce((total, campaign) => {
                          const price = surveyData.platformPrices[campaign.id] || '';
                          const raw = price.replace(/,/g, '');
                          const num = raw ? parseInt(raw, 10) : 0;
                          return total + num;
                        }, 0);
                        return `¥${sum.toLocaleString('ja-JP')}`;
                      })()}
                    </span>
                  </div>
                  <div className="text-xs mt-1" style={{ color: ds.text.secondary }}>
                    税込: {(() => {
                      const sum = activeCampaigns.reduce((total, campaign) => {
                        const price = surveyData.platformPrices[campaign.id] || '';
                        const raw = price.replace(/,/g, '');
                        const num = raw ? parseInt(raw, 10) : 0;
                        return total + num;
                      }, 0);
                      return `¥${Math.round(sum * 1.1).toLocaleString('ja-JP')}`;
                    })()}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : currentStepData.type === 'select' ? (
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
        ) : currentStepData.type === 'multi-date' ? (
          <div>
            <MultiItemInput
              type="date"
              value={surveyData[currentStepData.field as keyof SurveyData] as string}
              onChange={(val) => handleInputChange(currentStepData.field as keyof SurveyData, val)}
              label="複数の投稿日を追加"
              onPendingValueChange={(val) => setPendingUploadDate(val)}
            />
          </div>
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

  // If modal mode, wrap in modal overlay
  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4" style={{ backgroundColor: ds.bg.card }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold" style={{ color: ds.text.primary }}>基本情報入力</h2>
            {onCancel && (
              <button
                onClick={onCancel}
                className="hover:opacity-70 transition-opacity"
                style={{ color: ds.text.secondary }}
              >
                ✕
              </button>
            )}
          </div>
          {content}
        </div>
      </div>
    );
  }

  return content;
}
