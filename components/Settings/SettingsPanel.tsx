'use client';

import { useState } from 'react';
import { useDesignSystem } from '@/hooks/useDesignSystem';
import { Mail, Users, CreditCard, ChevronRight } from 'lucide-react';
import TemplateEditor from './TemplateEditor';

export default function SettingsPanel() {
  const ds = useDesignSystem();
  const [activeSection, setActiveSection] = useState<'template' | null>(null);

  const settingsOptions = [
    {
      id: 'template',
      title: 'テンプレート設定',
      description: 'メール送信のテンプレートを管理・編集',
      icon: Mail,
      color: '#3b82f6'
    },
    {
      id: 'users',
      title: 'ユーザー管理',
      description: 'チームメンバーとアクセス権限の管理',
      icon: Users,
      color: '#10b981',
      disabled: true
    },
    {
      id: 'billing',
      title: '請求設定',
      description: '支払い方法とプランの管理',
      icon: CreditCard,
      color: '#f59e0b',
      disabled: true
    }
  ];

  if (activeSection === 'template') {
    return <TemplateEditor onBack={() => setActiveSection(null)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: ds.text.primary }}>
          Settings
        </h2>
        <p className="text-sm mt-1" style={{ color: ds.text.secondary }}>
          システムの設定と管理
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => !option.disabled && setActiveSection(option.id as 'template')}
              disabled={option.disabled}
              className={`p-6 rounded-xl text-left transition-all duration-200 group ${
                option.disabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:shadow-lg transform hover:-translate-y-1'
              }`}
              style={{
                backgroundColor: ds.bg.card,
                borderColor: ds.border.primary,
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: option.color + '20' }}
                    >
                      <IconComponent 
                        className="w-5 h-5" 
                        style={{ color: option.color }}
                      />
                    </div>
                    <h3 className="font-semibold" style={{ color: ds.text.primary }}>
                      {option.title}
                    </h3>
                  </div>
                  <p className="text-sm" style={{ color: ds.text.secondary }}>
                    {option.description}
                  </p>
                  {option.disabled && (
                    <p className="text-xs mt-2 font-medium" style={{ color: '#f59e0b' }}>
                      準備中
                    </p>
                  )}
                </div>
                {!option.disabled && (
                  <ChevronRight 
                    className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: ds.text.secondary }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="rounded-xl p-6" style={{ backgroundColor: ds.bg.card, borderColor: ds.border.primary, borderWidth: '1px' }}>
        <h3 className="font-semibold mb-4" style={{ color: ds.text.primary }}>
          システム概要
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: ds.text.primary }}>
              3
            </div>
            <div className="text-sm" style={{ color: ds.text.secondary }}>
              アクティブテンプレート
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: ds.text.primary }}>
              4
            </div>
            <div className="text-sm" style={{ color: ds.text.secondary }}>
              チームメンバー
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: ds.text.primary }}>
              234
            </div>
            <div className="text-sm" style={{ color: ds.text.secondary }}>
              総インフルエンサー
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#10b981' }}>
              99.9%
            </div>
            <div className="text-sm" style={{ color: ds.text.secondary }}>
              稼働時間
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
