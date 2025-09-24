'use client';

import { useState, useEffect } from 'react';
import { useDesignSystem } from '@/hooks/useDesignSystem';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';

interface TemplateRule {
  id: number;
  name: string;
  conditions: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
  subject: string;
  body: string;
}

interface TemplateEditorProps {
  onBack: () => void;
}

export default function TemplateEditor({ onBack }: TemplateEditorProps) {
  const ds = useDesignSystem();
  const [selectedRule, setSelectedRule] = useState<number>(0);
  const [success, setSuccess] = useState<string | null>(null);

  // Template rules configuration
  const [templateRules, setTemplateRules] = useState<TemplateRule[]>([
    {
      id: 1,
      name: 'Twitter初回アウトリーチ',
      conditions: [
        { field: 'platform', operator: '=', value: 'tw' },
        { field: 'outreachType', operator: '=', value: '1st time outreach' }
      ],
      subject: '【英会話アプリのPR依頼】',
      body: `【英会話アプリのPR依頼】
{greeting}、AI英会話アプリ「スピーク」の{teamMemberName}と申します。この度4月1日から行われるキャンペーン期間中にてPR投稿にご協力いただける形を募集しております。

首都圏・関西にて高畑充希さんを起用したテレビCMの再放送も予定しており、その一環としてぜひ、{influencerName}様にご協力いただきたいと考えております。

・投稿内容：今までに高いインプレッションを獲得した投稿フォーマットにてスピークを自然に入れ込む形でPR。リプ欄にリンクとPR内容を挿入。（例：https://x.com/mitsu7travel/status/1877882747529687422）
・投稿日希望：8月1日~8月3日

スケジュールがタイトとはなっていますが、以下の資料等をご覧の上ご判断いただきご興味がございましたらご希望の報酬をお聞かせいただけますでしょうか？

こちらの資料には今までのPRの経歴や詳細情報を記載しておりますので、ぜひお目通しいただければ幸いです：
・https://usespeak.notion.site/YouTube-1f3792ec2f108090b3fbe9b4051a4a4c?pvs=4

ご返信をお待ちしております。
※返信はCCも含め全員にお願いいたします。`
    },
    {
      id: 2,
      name: 'ショート動画初回アウトリーチ',
      conditions: [
        { field: 'platform', operator: '=', value: 'sv' },
        { field: 'outreachType', operator: '=', value: '1st time outreach' }
      ],
      subject: 'スピークのPR依頼｜{influencerName}様',
      body: `{influencerName}様

{greeting}。Speakeasy Labs, Inc.のマーケティングチームです。
{influencerName}様のコンテンツを拝見し、ぜひ弊社が開発するAI英会話アプリ「スピーク」のPRを縦動画（YouTubeショート、Reels、TikTok等）にて依頼させていただきたいと思いご連絡差し上げました。

【スピークとは】
米国シリコンバレー発のスピーキングに特化した英会話アプリです。

✅ OpenAI（ChatGPT開発元）から資金調達に成功
✅ 2023年に日本上陸後、App Store/Google Play教育カテゴリで1位を複数回獲得
✅ 2025年1月に高畑充希さんを起用したテレビCMを公開

【PRについて】
フォーマット：縦動画（YouTubeショート、Reels、TikTok等）フル動画
PR内容：スピークを{influencerName}様の普段のコンテンツスタイルに合わせて自然に紹介
投稿希望時期：2026年1月初旬
契約内容：広告としての二次利用込み
報酬：ご希望の金額を伺ったうえで相談させていただければと思います

PRに進む前に、事前にスピークのプレミアムプランをお渡しします。
実際にご利用いただき、自信を持ってお勧めできると感じていただけた場合にPRを依頼させていただきたいと思っております。

【次のステップ】
ご興味をいただけましたら、ご希望の報酬額を税込でお聞かせいただけますでしょうか？

【参考資料】
これまでのPR実績や詳細情報を以下の資料にまとめております。ぜひご一読いただけますと幸いです：
・インフルエンサー向け資料：https://usespeak.notion.site/5d43676ad8da4a418c722a7b47229f3d?pvs=4
・ホームページ：https://www.speak.com/jp
・テレビCM：https://www.youtube.com/watch?v=vH6f_Nctri0

{influencerName}様のご返信をお待ちしております。
※返信はCCも含め全員にお願いいたします。

ー
Speakeasy Labs, Inc.
{teamMemberName}`
    },
    {
      id: 3,
      name: 'ポッドキャスト初回アウトリーチ',
      conditions: [
        { field: 'platform', operator: '=', value: 'pc' },
        { field: 'outreachType', operator: '=', value: '1st time outreach' }
      ],
      subject: 'スピークのPR依頼｜{influencerName}様',
      body: `{influencerName}様
{greeting}。
AI英会話アプリ「スピーク」を運営するSpeakeasy Labs, Inc.のマーケティングチームです。
{influencerName}様のPodcastを拝聴し、リスナーとの自然で信頼感のあるコミュニケーションに大変共感し、ぜひスピークのPRについてご相談させていただきたくご連絡いたしました。

【スピークとは】
シリコンバレー発の、スピーキングに特化したAI英会話アプリです。
ネイティブと会話しているような自然な英語練習が、アプリひとつでいつでもどこでもできます。

✅ OpenAI（ChatGPTの開発元）から出資を受けた最先端AI技術
✅ 日本上陸からApp Store・Google Play教育カテゴリで1位を複数回獲得
✅ 2025年1月には高畑充希さん出演のテレビCMを公開

【Podcast PRのご相談】
・フォーマット：Podcast内でのご紹介（ホストリード/ご相談の上決定）
・配信希望時期：**ご都合に合わせ調整可能**
・報酬：ご希望の金額をお聞きした上でご相談させていただけますと幸いです

事前にスピークのプレミアムプランをご提供いたしますので、実際にご利用いただき、ご自身の言葉で安心してリスナーの皆様にご紹介いただけるかご判断いただければと思っております。

【参考資料】
サービスやこれまでのPR事例について、以下よりご確認いただけます：
・インフルエンサー向け資料：https://www.notion.so/usespeak/Podcast-224792ec2f1080f2a7d5fce804ce4b93?source=copy_link
・ホームページ：https://www.speak.com/jp
・テレビCM：https://www.youtube.com/watch?v=vH6f_Nctri0

Podcastという信頼性の高いメディアを通じ、リスナーの皆様にスピークを届けられることを楽しみにしております。

ご興味をお持ちいただけましたら、ぜひご希望の報酬額（税込）をお聞かせください。

{influencerName}様のご返信を心よりお待ちしております。
※ご返信はCCも含め全員にお願いいたします。

ー
Speakeasy Labs, Inc.
{teamMemberName}`
    }
  ]);

  const fieldOptions = [
    { value: 'platform', label: 'プラットフォーム' },
    { value: 'outreachType', label: 'アウトリーチタイプ' },
    { value: 'previousContact', label: '過去の連絡' }
  ];

  const operatorOptions = [
    { value: '=', label: '=' },
    { value: '!=', label: '!=' },
    { value: 'contains', label: '含む' }
  ];

  const valueOptions = {
    platform: [
      { value: 'tw', label: 'Twitter/X' },
      { value: 'sv', label: 'ショート動画' },
      { value: 'pc', label: 'ポッドキャスト' },
      { value: 'yt', label: 'YouTube横動画' },
      { value: 'yts', label: 'YouTube Shorts' }
    ],
    outreachType: [
      { value: '1st time outreach', label: '初回アウトリーチ' },
      { value: 'PR prep', label: 'PR準備' },
      { value: '2nd Outreach', label: '2回目アウトリーチ' }
    ],
    previousContact: [
      { value: 'true', label: 'あり' },
      { value: 'false', label: 'なし' }
    ]
  };

  // Load templates when component mounts
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      
      if (data.success && data.templates) {
        setTemplateRules(data.templates);
      }
    } catch (error) {
      console.error('❌ Error loading templates:', error);
    }
  };

  const addNewRule = () => {
    const newRule: TemplateRule = {
      id: Date.now(),
      name: '新しいルール',
      conditions: [{ field: 'platform', operator: '=', value: 'tw' }],
      subject: '件名を入力',
      body: 'メッセージ本文を入力'
    };
    setTemplateRules([...templateRules, newRule]);
    setSelectedRule(templateRules.length);
  };

  const deleteRule = (index: number) => {
    const newRules = templateRules.filter((_, i) => i !== index);
    setTemplateRules(newRules);
    if (selectedRule === index) setSelectedRule(0);
  };

  const updateRule = (index: number, updates: Partial<TemplateRule>) => {
    const newRules = [...templateRules];
    newRules[index] = { ...newRules[index], ...updates };
    setTemplateRules(newRules);
  };

  const addCondition = (ruleIndex: number) => {
    const newRules = [...templateRules];
    newRules[ruleIndex].conditions.push({ field: 'platform', operator: '=', value: 'tw' });
    setTemplateRules(newRules);
  };

  const updateCondition = (ruleIndex: number, condIndex: number, updates: Partial<{ field: string; operator: string; value: string }>) => {
    const newRules = [...templateRules];
    newRules[ruleIndex].conditions[condIndex] = { ...newRules[ruleIndex].conditions[condIndex], ...updates };
    setTemplateRules(newRules);
  };

  const deleteCondition = (ruleIndex: number, condIndex: number) => {
    const newRules = [...templateRules];
    newRules[ruleIndex].conditions.splice(condIndex, 1);
    setTemplateRules(newRules);
  };

  const saveTemplates = async () => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save',
          templates: templateRules,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('テンプレートが保存されました！');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setSuccess('保存に失敗しました: ' + (data.error || 'Unknown error'));
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (error) {
      console.error('❌ Error saving templates:', error);
      setSuccess('保存に失敗しました');
      setTimeout(() => setSuccess(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 p-2 rounded-lg transition-colors hover:bg-opacity-80"
          style={{ color: ds.text.secondary }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>戻る</span>
        </button>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: ds.text.primary }}>
            テンプレート設定
          </h2>
          <p className="text-sm mt-1" style={{ color: ds.text.secondary }}>
            メール送信テンプレートの管理と編集
          </p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="flex items-center space-x-2 p-3 rounded-lg" style={{ backgroundColor: '#f0f9ff', borderColor: '#bae6fd', borderWidth: '1px' }}>
          <span className="text-blue-600">{success}</span>
        </div>
      )}

      {/* Template Editor Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Template Rules List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium" style={{ color: ds.text.primary }}>
              テンプレートルール
            </h4>
            <button
              onClick={addNewRule}
              className="p-1 rounded-lg transition-colors hover:bg-opacity-80"
              style={{ color: ds.button.primary.bg }}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            {templateRules.map((rule, index) => (
              <div
                key={rule.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                  selectedRule === index ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: selectedRule === index ? ds.button.primary.bg + '10' : ds.bg.card,
                  borderColor: selectedRule === index ? ds.button.primary.bg : ds.border.primary
                }}
                onClick={() => setSelectedRule(index)}
              >
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-sm" style={{ color: ds.text.primary }}>
                    {rule.name}
                  </h5>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRule(index);
                    }}
                    className="p-1 rounded hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </div>
                <div className="text-xs mt-1" style={{ color: ds.text.secondary }}>
                  {rule.conditions.map((cond, i) => (
                    <span key={i}>
                      {fieldOptions.find(f => f.value === cond.field)?.label} {cond.operator} {
                        valueOptions[cond.field as keyof typeof valueOptions]?.find(v => v.value === cond.value)?.label || cond.value
                      }
                      {i < rule.conditions.length - 1 && ' AND '}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle: Condition Builder */}
        {templateRules[selectedRule] && (
          <div className="space-y-4">
            <h4 className="font-medium" style={{ color: ds.text.primary }}>
              条件設定
            </h4>
            
            {/* Rule Name */}
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: ds.text.secondary }}>
                ルール名
              </label>
              <input
                type="text"
                value={templateRules[selectedRule].name}
                onChange={(e) => updateRule(selectedRule, { name: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: ds.form.input.bg,
                  borderColor: ds.form.input.border,
                  color: ds.text.primary,
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
              />
            </div>

            {/* Conditions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium" style={{ color: ds.text.secondary }}>
                  条件 (IF)
                </label>
                <button
                  onClick={() => addCondition(selectedRule)}
                  className="p-1 rounded-lg transition-colors"
                  style={{ color: ds.button.primary.bg }}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              
              <div className="space-y-3">
                {templateRules[selectedRule].conditions.map((condition, condIndex) => (
                  <div key={condIndex} className="flex items-center space-x-2">
                    {condIndex > 0 && (
                      <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: ds.bg.surface, color: ds.text.secondary }}>
                        AND
                      </span>
                    )}
                    
                    {/* Field */}
                    <select
                      value={condition.field}
                      onChange={(e) => {
                        const newValue = valueOptions[e.target.value as keyof typeof valueOptions]?.[0]?.value || '';
                        updateCondition(selectedRule, condIndex, { field: e.target.value, value: newValue });
                      }}
                      className="px-2 py-1 text-xs rounded focus:outline-none"
                      style={{
                        backgroundColor: ds.form.input.bg,
                        borderColor: ds.form.input.border,
                        color: ds.text.primary,
                        borderWidth: '1px',
                        borderStyle: 'solid'
                      }}
                    >
                      {fieldOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>

                    {/* Operator */}
                    <select
                      value={condition.operator}
                      onChange={(e) => updateCondition(selectedRule, condIndex, { operator: e.target.value })}
                      className="px-2 py-1 text-xs rounded focus:outline-none"
                      style={{
                        backgroundColor: ds.form.input.bg,
                        borderColor: ds.form.input.border,
                        color: ds.text.primary,
                        borderWidth: '1px',
                        borderStyle: 'solid'
                      }}
                    >
                      {operatorOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>

                    {/* Value */}
                    <select
                      value={condition.value}
                      onChange={(e) => updateCondition(selectedRule, condIndex, { value: e.target.value })}
                      className="px-2 py-1 text-xs rounded focus:outline-none flex-1"
                      style={{
                        backgroundColor: ds.form.input.bg,
                        borderColor: ds.form.input.border,
                        color: ds.text.primary,
                        borderWidth: '1px',
                        borderStyle: 'solid'
                      }}
                    >
                      {valueOptions[condition.field as keyof typeof valueOptions]?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>

                    {/* Remove condition */}
                    <button
                      onClick={() => deleteCondition(selectedRule, condIndex)}
                      className="p-1 rounded hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Variables Help */}
            <div className="rounded-lg p-3" style={{ backgroundColor: ds.bg.surface, borderColor: ds.border.primary, borderWidth: '1px' }}>
              <h5 className="font-medium mb-2 text-sm" style={{ color: ds.text.primary }}>
                使用可能な変数
              </h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <code 
                    className="px-1 py-0.5 rounded text-xs"
                    style={{ 
                      backgroundColor: ds.bg.surface,
                      color: ds.text.primary,
                      borderColor: ds.border.primary,
                      borderWidth: '1px',
                      borderStyle: 'solid'
                    }}
                  >
                    {'{influencerName}'}
                  </code>
                  <p className="text-xs mt-0.5" style={{ color: ds.text.secondary }}>インフルエンサー名</p>
                </div>
                <div>
                  <code 
                    className="px-1 py-0.5 rounded text-xs"
                    style={{ 
                      backgroundColor: ds.bg.surface,
                      color: ds.text.primary,
                      borderColor: ds.border.primary,
                      borderWidth: '1px',
                      borderStyle: 'solid'
                    }}
                  >
                    {'{teamMemberName}'}
                  </code>
                  <p className="text-xs mt-0.5" style={{ color: ds.text.secondary }}>送信者名</p>
                </div>
                <div>
                  <code 
                    className="px-1 py-0.5 rounded text-xs"
                    style={{ 
                      backgroundColor: ds.bg.surface,
                      color: ds.text.primary,
                      borderColor: ds.border.primary,
                      borderWidth: '1px',
                      borderStyle: 'solid'
                    }}
                  >
                    {'{greeting}'}
                  </code>
                  <p className="text-xs mt-0.5" style={{ color: ds.text.secondary }}>挨拶</p>
                </div>
                <div>
                  <code 
                    className="px-1 py-0.5 rounded text-xs"
                    style={{ 
                      backgroundColor: ds.bg.surface,
                      color: ds.text.primary,
                      borderColor: ds.border.primary,
                      borderWidth: '1px',
                      borderStyle: 'solid'
                    }}
                  >
                    {'{platform}'}
                  </code>
                  <p className="text-xs mt-0.5" style={{ color: ds.text.secondary }}>プラットフォーム</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right: Template Editor */}
        {templateRules[selectedRule] && (
          <div className="space-y-4">
            <h4 className="font-medium" style={{ color: ds.text.primary }}>
              テンプレート編集
            </h4>
            
            {/* Subject */}
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: ds.text.secondary }}>
                件名
              </label>
              <input
                type="text"
                value={templateRules[selectedRule].subject}
                onChange={(e) => updateRule(selectedRule, { subject: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: ds.form.input.bg,
                  borderColor: ds.form.input.border,
                  color: ds.text.primary,
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
              />
            </div>

            {/* Body */}
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: ds.text.secondary }}>
                本文
              </label>
              <textarea
                rows={20}
                value={templateRules[selectedRule].body}
                onChange={(e) => updateRule(selectedRule, { body: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 font-mono resize-none"
                style={{
                  backgroundColor: ds.form.input.bg,
                  borderColor: ds.form.input.border,
                  color: ds.text.primary,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  lineHeight: '1.5'
                }}
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={saveTemplates}
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: ds.button.primary.bg,
                  color: ds.button.primary.text
                }}
              >
                保存
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
