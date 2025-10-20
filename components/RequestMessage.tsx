'use client';

import React, { useState } from 'react';
import { useDesignSystem } from '@/hooks/useDesignSystem';
import { Calendar, FileText, Send, X } from 'lucide-react';
import { RequestType } from '@/types';

export interface RequestOption {
  label: string;
  value: RequestType;
  icon?: React.ReactNode;
  description?: string;
}

export interface RequestField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'url';
  placeholder?: string;
  required?: boolean;
  currentValue?: string;
}

interface RequestMessageProps {
  question: string;
  options: RequestOption[];
  onSubmit: (data: {
    type: RequestType;
    title: string;
    description: string;
    fields: Record<string, string>;
  }) => Promise<void> | void;
  onCancel?: () => void;
}

/**
 * 汎用的な申請メッセージコンポーネント
 * チャットボット内で使用し、インフルエンサーが各種申請を行うためのインターフェースを提供します。
 * 
 * 機能：
 * - ボタン選択形式で申請タイプを選択
 * - 動的な入力フォーム（テキスト、URL、日付など）
 * - 現在の値の表示
 * - バリデーション
 */
export default function RequestMessage({
  question,
  options,
  onSubmit,
  onCancel,
}: RequestMessageProps) {
  const ds = useDesignSystem();
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 選択されたタイプに基づいてフィールドを取得
  const getFieldsForType = (type: RequestType): RequestField[] => {
    switch (type) {
      case 'plan_date_change':
        return [
          {
            name: 'newDate',
            label: '希望する新しい構成案提出日',
            type: 'date',
            required: true,
          },
          {
            name: 'reason',
            label: '変更理由',
            type: 'textarea',
            placeholder: '構成案提出日の変更が必要な理由をご記入ください',
            required: true,
          },
        ];
      case 'draft_date_change':
        return [
          {
            name: 'newDate',
            label: '希望する新しい初稿提出日',
            type: 'date',
            required: true,
          },
          {
            name: 'reason',
            label: '変更理由',
            type: 'textarea',
            placeholder: '初稿提出日の変更が必要な理由をご記入ください',
            required: true,
          },
        ];
      case 'live_date_change':
        return [
          {
            name: 'newDate',
            label: '希望する新しい投稿日',
            type: 'date',
            required: true,
          },
          {
            name: 'reason',
            label: '変更理由',
            type: 'textarea',
            placeholder: '投稿日の変更が必要な理由をご記入ください',
            required: true,
          },
        ];
      default:
        return [];
    }
  };

  const selectedOption = options.find(opt => opt.value === selectedType);
  const fields = selectedType ? getFieldsForType(selectedType) : [];

  // フォーム送信時のバリデーション
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      if (field.required && !formData[field.name]?.trim()) {
        newErrors[field.name] = `${field.label}は必須項目です`;
      }
      
      // URL検証
      if (field.type === 'url' && formData[field.name]) {
        try {
          new URL(formData[field.name]);
        } catch {
          newErrors[field.name] = '有効なURLを入力してください';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!selectedType || !validateForm() || isSubmitting || isSubmitted) return;

    const title = selectedOption?.label || '変更申請';
    const description = formData.reason || '';

    setIsSubmitting(true);

    try {
      await onSubmit({
        type: selectedType,
        title,
        description,
        fields: formData,
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit request:', error);
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedType(null);
    setFormData({});
    setErrors({});
    if (onCancel) onCancel();
  };

  return (
    <div
      className="inline-block px-4 py-3 rounded-2xl text-sm max-w-full"
      style={{
        backgroundColor: ds.bg.surface,
        color: ds.text.primary,
        borderColor: ds.border.primary,
        borderWidth: '1px',
        borderStyle: 'solid',
      }}
    >
      {/* 質問文 */}
      <p className="mb-3 font-medium leading-relaxed">{question}</p>

      {/* ステップ1: 申請タイプの選択 */}
      {!selectedType && (
        <div className="flex flex-col gap-2">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedType(option.value)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all hover:opacity-90"
              style={{
                backgroundColor: ds.bg.card,
                color: ds.text.primary,
                borderColor: ds.border.primary,
                borderWidth: '1px',
                borderStyle: 'solid',
              }}
            >
              {option.icon && (
                <span style={{ color: ds.text.accent }}>
                  {option.icon}
                </span>
              )}
              <div className="flex-1">
                <div className="font-medium">{option.label}</div>
                {option.description && (
                  <div className="text-xs mt-0.5" style={{ color: ds.text.secondary }}>
                    {option.description}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ステップ2: 詳細入力フォーム */}
      {selectedType && (
        <div className="space-y-3 mt-3">
          {/* 選択したタイプを表示 */}
          <div
            className="flex items-center justify-between px-3 py-2 rounded-lg"
            style={{
              backgroundColor: ds.bg.card,
              borderColor: ds.border.secondary,
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
          >
            <div className="flex items-center gap-2">
              {selectedOption?.icon && (
                <span style={{ color: ds.text.accent }}>
                  {selectedOption.icon}
                </span>
              )}
              <span className="text-sm font-medium">{selectedOption?.label}</span>
            </div>
            {!isSubmitted && (
              <button
                onClick={() => {
                  setSelectedType(null);
                  setFormData({});
                  setErrors({});
                }}
                disabled={isSubmitting}
                className="p-1 rounded hover:bg-opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ color: ds.text.secondary }}
                title="選び直す"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 入力フィールド */}
          {fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium mb-1.5" style={{ color: ds.text.primary }}>
                {field.label}
                {field.required && <span style={{ color: '#ef4444' }}> *</span>}
              </label>
              
              {field.currentValue && (
                <div
                  className="text-xs mb-1 px-2 py-1 rounded"
                  style={{
                    backgroundColor: ds.bg.card,
                    color: ds.text.secondary,
                  }}
                >
                  現在: {field.currentValue}
                </div>
              )}

              {field.type === 'textarea' ? (
                <textarea
                  value={formData[field.name] || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, [field.name]: e.target.value });
                    if (errors[field.name]) {
                      setErrors({ ...errors, [field.name]: '' });
                    }
                  }}
                  placeholder={field.placeholder}
                  rows={3}
                  disabled={isSubmitting || isSubmitted}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: ds.form.input.bg,
                    borderColor: errors[field.name] ? '#ef4444' : ds.form.input.border,
                    color: ds.text.primary,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                  }}
                />
              ) : (
                <input
                  type={field.type}
                  value={formData[field.name] || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, [field.name]: e.target.value });
                    if (errors[field.name]) {
                      setErrors({ ...errors, [field.name]: '' });
                    }
                  }}
                  placeholder={field.placeholder}
                  disabled={isSubmitting || isSubmitted}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: ds.form.input.bg,
                    borderColor: errors[field.name] ? '#ef4444' : ds.form.input.border,
                    color: ds.text.primary,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                  }}
                />
              )}

              {errors[field.name] && (
                <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
                  {errors[field.name]}
                </p>
              )}
            </div>
          ))}

          {/* アクションボタン */}
          <div className="flex gap-2 mt-4">
            {!isSubmitted ? (
              <>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: ds.button.primary.bg,
                    color: ds.button.primary.text,
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      送信中...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      申請を送信
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: ds.bg.card,
                    color: ds.text.primary,
                    borderColor: ds.border.primary,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                  }}
                >
                  キャンセル
                </button>
              </>
            ) : (
              <div
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                送信完了
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ヘルパー関数：デフォルトの申請オプションを生成
export const getDefaultRequestOptions = (): RequestOption[] => [
  {
    label: '構成案提出日の変更申請',
    value: 'plan_date_change',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    label: '初稿提出日の変更申請',
    value: 'draft_date_change',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    label: '投稿日の変更申請',
    value: 'live_date_change',
    icon: <Calendar className="w-5 h-5" />,
  },
];

