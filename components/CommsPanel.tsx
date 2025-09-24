'use client';

import { useState, useEffect, useRef } from 'react';
import { useDesignSystem } from '@/hooks/useDesignSystem';
import { Search, Mail, Send, User, ChevronLeft, ChevronRight, Copy, CheckCircle, AlertCircle, Loader2, Settings, X, Plus, Trash2, ChevronDown } from 'lucide-react';

interface InfluencerData {
  id: string;
  name: string;
  email: string;
  platform: string;
  outreachType: string;
  previousContact: boolean;
  teamMemberName: string;
  status: string;
  dateOutreach: string;
}

interface MessagePreview {
  influencerId: string;
  influencerName: string;
  email: string;
  subject: string;
  body: string;
}

export default function CommsPanel() {
  const ds = useDesignSystem();
  const NAME_PLACEHOLDER = '【名前未入力】';
  const [influencers, setInfluencers] = useState<InfluencerData[]>([]);
  const [selectedInfluencers, setSelectedInfluencers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [teamMemberName, setTeamMemberName] = useState('');
  const [templateType, setTemplateType] = useState<'リーチアウト' | 'PR準備' | '送金準備'>('リーチアウト');

  const teamMemberOptions = ['田村 直祈', '石川 美鈴', '網藏 薫', '川上 央佳'];

  const [messagePreview, setMessagePreview] = useState<MessagePreview[]>([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [editableSubject, setEditableSubject] = useState('');
  const [editableBody, setEditableBody] = useState('');
  const [loadingInfluencers, setLoadingInfluencers] = useState(false);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [markingAsSent, setMarkingAsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  // Guard to avoid double-fetch on mount in React Strict Mode (dev)
  const didFetchRef = useRef(false);

  // Fetch influencers on component mount (guarded against double-invoke in dev)
  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    fetchInfluencers();
  }, []);

  // Update editable fields when preview changes
  useEffect(() => {
    if (messagePreview.length > 0 && messagePreview[currentPreviewIndex]) {
      const current = messagePreview[currentPreviewIndex];
      setEditableSubject(current.subject);
      setEditableBody(current.body);
    }
  }, [messagePreview, currentPreviewIndex]);

  const fetchInfluencers = async () => {
    try {
      setLoadingInfluencers(true);
      setError(null);
      
      const response = await fetch('/api/comms?action=getSelectedInfluencers');
      const data = await response.json();
      
      if (data.success) {
        setInfluencers(data.influencers);
        console.log('✅ Loaded influencers:', data.influencers.length);
      } else {
        setError(data.error || 'Failed to load influencers');
      }
    } catch (err: any) {
      console.error('❌ Error fetching influencers:', err);
      setError('Failed to fetch influencers data');
    } finally {
      setLoadingInfluencers(false);
    }
  };

  const handleInfluencerToggle = (influencerId: string) => {
    const newSelected = new Set(selectedInfluencers);
    if (newSelected.has(influencerId)) {
      newSelected.delete(influencerId);
    } else {
      newSelected.add(influencerId);
    }
    setSelectedInfluencers(newSelected);
    
    // Reset preview when selection changes
    setMessagePreview([]);
    setCurrentPreviewIndex(0);
  };

  const handleSelectAll = () => {
    const filtered = getFilteredInfluencers();
    const allFilteredSelected = filtered.length > 0 && filtered.every(inf => selectedInfluencers.has(inf.id));
    
    if (allFilteredSelected) {
      // Deselect all filtered influencers
      const newSelected = new Set(selectedInfluencers);
      filtered.forEach(inf => newSelected.delete(inf.id));
      setSelectedInfluencers(newSelected);
    } else {
      // Select all filtered influencers
      const newSelected = new Set(selectedInfluencers);
      filtered.forEach(inf => newSelected.add(inf.id));
      setSelectedInfluencers(newSelected);
    }
    
    // Reset preview when selection changes
    setMessagePreview([]);
    setCurrentPreviewIndex(0);
  };

  const generatePreview = async () => {
    if (selectedInfluencers.size === 0) {
      setError('Please select at least one influencer');
      return;
    }
    
    if (!teamMemberName.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      setGeneratingPreview(true);
      setError(null);
      
      const response = await fetch('/api/comms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generateMessages',
          influencerIds: Array.from(selectedInfluencers),
          teamMemberName: teamMemberName.trim(),
          templateType: templateType,
          // Send selected influencer data to avoid redundant server fetch
          influencers: influencers.filter(inf => selectedInfluencers.has(inf.id)),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessagePreview(data.messages);
        setCurrentPreviewIndex(0);
        console.log('✅ Generated message previews:', data.messages.length);
      } else {
        setError(data.error || 'Failed to generate message preview');
      }
    } catch (err: any) {
      console.error('❌ Error generating preview:', err);
      setError('Failed to generate message preview');
    } finally {
      setGeneratingPreview(false);
    }
  };

  const updateCurrentMessage = () => {
    if (messagePreview.length > 0 && messagePreview[currentPreviewIndex]) {
      const updatedPreview = [...messagePreview];
      updatedPreview[currentPreviewIndex] = {
        ...updatedPreview[currentPreviewIndex],
        subject: editableSubject,
        body: editableBody,
      };
      setMessagePreview(updatedPreview);
    }
  };

  const navigatePreview = (direction: 'prev' | 'next') => {
    // Save current edits before navigating
    updateCurrentMessage();
    
    if (direction === 'prev' && currentPreviewIndex > 0) {
      setCurrentPreviewIndex(currentPreviewIndex - 1);
    } else if (direction === 'next' && currentPreviewIndex < messagePreview.length - 1) {
      setCurrentPreviewIndex(currentPreviewIndex + 1);
    }
  };

  const copyToClipboard = async () => {
    const current = messagePreview[currentPreviewIndex];
    if (!current) return;

    const textToCopy = `件名: ${editableSubject}\n\n${editableBody}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const markAsSent = async () => {
    const current = messagePreview[currentPreviewIndex];
    if (!current) return;

    try {
      setMarkingAsSent(true);
      setError(null);
      
      const response = await fetch('/api/comms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'markAsSent',
          influencerId: current.influencerId,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('送信済みとしてマークしました！');
        // Refresh the influencer list to reflect updated status
        fetchInfluencers();
        // Move to next message or close preview if this was the last one
        if (messagePreview.length > 1) {
          if (currentPreviewIndex < messagePreview.length - 1) {
            navigatePreview('next');
          } else {
            setCurrentPreviewIndex(currentPreviewIndex - 1);
          }
          // Remove current message from preview
          const updatedPreview = messagePreview.filter((_, index) => index !== currentPreviewIndex);
          setMessagePreview(updatedPreview);
        } else {
          // Last message, close preview
          setMessagePreview([]);
          setSelectedInfluencers(new Set());
          setCurrentPreviewIndex(0);
        }
      } else {
        setError(data.error || 'Failed to mark as sent');
      }
    } catch (err: any) {
      console.error('❌ Error marking as sent:', err);
      setError('Failed to mark as sent');
    } finally {
      setMarkingAsSent(false);
    }
  };

  const sendEmails = async () => {
    if (messagePreview.length === 0) {
      setError('No messages to send');
      return;
    }

    // Update current message before sending
    updateCurrentMessage();

    // Filter out messages for influencers without email
    const emailMessages = messagePreview.filter(msg => msg.email && msg.email.trim());
    
    if (emailMessages.length === 0) {
      setError('No influencers with email addresses selected');
      return;
    }

    try {
      setSending(true);
      setError(null);
      
      const response = await fetch('/api/comms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sendEmails',
          messages: emailMessages,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Successfully sent ${data.sentCount} emails!`);
        setMessagePreview([]);
        setSelectedInfluencers(new Set());
        setCurrentPreviewIndex(0);
        // Refresh the influencer list to reflect updated status
        fetchInfluencers();
      } else {
        setError(data.error || 'Failed to send emails');
      }
    } catch (err: any) {
      console.error('❌ Error sending emails:', err);
      setError('Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  const getFilteredInfluencers = () => {
    return influencers.filter(influencer =>
      influencer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      influencer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      influencer.platform.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const mapPlatformToJapanese = (platform: string): string => {
    const platformMap: { [key: string]: string } = {
      'yt': 'YouTube横動画',
      'yts': 'YouTube Shorts',
      'tw': 'X (Twitter)',
      'ig': 'Instagram',
      'tt': 'TikTok',
      'igr': 'Instagram Reels',
      'sv': 'ショート動画',
      'pc': 'Podcasts',
      'vc': 'Voicy',
      'bl': 'Blog',
    };
    return platformMap[platform] || platform;
  };

  const filteredInfluencers = getFilteredInfluencers();
  const allFilteredSelected = filteredInfluencers.length > 0 && filteredInfluencers.every(inf => selectedInfluencers.has(inf.id));
  const currentMessage = messagePreview[currentPreviewIndex];
  const hasPlaceholder = editableSubject.includes(NAME_PLACEHOLDER) || editableBody.includes(NAME_PLACEHOLDER);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: ds.text.primary }}>
          連絡 - インフルエンサー連絡
        </h2>
        <p className="text-sm mt-1" style={{ color: ds.text.secondary }}>
          選択されたインフルエンサーにカスタマイズされたメールを送信
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="flex items-center space-x-2 p-3 rounded-lg" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: '1px' }}>
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 p-3 rounded-lg" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: '1px' }}>
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-700">{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Selection Interface */}
        <div className="space-y-6">
          {/* Team Member Name Selection */}
          <div className="rounded-xl p-4" style={{ backgroundColor: ds.bg.card, borderColor: ds.border.primary, borderWidth: '1px' }}>
            <label className="block text-sm font-medium mb-2" style={{ color: ds.text.primary }}>
              送信者名 *
            </label>
            <select
              value={teamMemberName}
              onChange={(e) => setTeamMemberName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
              style={{
                backgroundColor: ds.form.input.bg,
                borderColor: ds.form.input.border,
                color: ds.text.primary,
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
            >
              <option value="">送信者を選択してください</option>
              {teamMemberOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Template Selection */}
          <div className="rounded-xl p-4" style={{ backgroundColor: ds.bg.card, borderColor: ds.border.primary, borderWidth: '1px' }}>
            <label className="block text-sm font-medium mb-2" style={{ color: ds.text.primary }}>
              テンプレート選択
            </label>
            <select
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value as 'リーチアウト' | 'PR準備' | '送金準備')}
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
              style={{
                backgroundColor: ds.form.input.bg,
                borderColor: ds.form.input.border,
                color: ds.text.primary,
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
            >
              <option value="リーチアウト">リーチアウト</option>
              <option value="PR準備">PR準備</option>
              <option value="送金準備">送金準備</option>
            </select>
            {templateType !== 'リーチアウト' && (
              <p className="text-xs mt-2" style={{ color: ds.text.secondary }}>
                ※ {templateType}テンプレートは準備中です
              </p>
            )}
          </div>

          {/* Influencer Selection */}
          <div className="rounded-xl p-4" style={{ backgroundColor: ds.bg.card, borderColor: ds.border.primary, borderWidth: '1px' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: ds.text.primary }}>
                インフルエンサー選択
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm" style={{ color: ds.text.secondary }}>
                  {selectedInfluencers.size} / {filteredInfluencers.length} 選択済み
                </span>
                <button
                  onClick={handleSelectAll}
                  className="text-sm px-3 py-1 rounded transition-colors"
                  style={{
                    backgroundColor: ds.button.secondary.bg,
                    color: ds.button.secondary.text
                  }}
                >
                  {allFilteredSelected ? '全解除' : '全選択'}
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={16} style={{ color: ds.text.secondary }} />
              <input
                type="text"
                placeholder="インフルエンサー名、メール、プラットフォームで検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: ds.form.input.bg,
                  borderColor: ds.form.input.border,
                  color: ds.text.primary,
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
              />
            </div>

            {/* Generate Preview Button */}
            <div className="mb-4">
              <button
                onClick={generatePreview}
                disabled={generatingPreview || selectedInfluencers.size === 0 || !teamMemberName.trim()}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: ds.button.primary.bg,
                  color: ds.button.primary.text
                }}
              >
                {generatingPreview ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                <span>プレビュー生成</span>
              </button>
            </div>

            {/* Influencer List */}
            {loadingInfluencers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: ds.text.secondary }} />
                <span className="ml-2" style={{ color: ds.text.secondary }}>読み込み中...</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredInfluencers.map(influencer => (
                  <div
                    key={influencer.id}
                    className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors"
                    style={{
                      backgroundColor: selectedInfluencers.has(influencer.id) ? ds.bg.surface : 'transparent',
                      borderColor: selectedInfluencers.has(influencer.id) ? ds.text.accent : ds.border.secondary,
                      borderWidth: '1px',
                      borderStyle: 'solid'
                    }}
                    onClick={() => handleInfluencerToggle(influencer.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedInfluencers.has(influencer.id)}
                      onChange={() => handleInfluencerToggle(influencer.id)}
                      className="w-4 h-4 rounded"
                    />
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: ds.button.primary.bg + '20' }}>
                        <User size={14} style={{ color: ds.button.primary.bg }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" style={{ color: ds.text.primary }}>
                          {influencer.name}
                        </p>
                        <p className="text-sm truncate" style={{ color: ds.text.secondary }}>
                          {influencer.email || 'メールなし'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-medium" style={{ color: ds.text.primary }}>
                          {mapPlatformToJapanese(influencer.platform)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredInfluencers.length === 0 && !loadingInfluencers && (
                  <div className="text-center py-8" style={{ color: ds.text.secondary }}>
                    検索条件に一致するインフルエンサーが見つかりません
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Dynamic Message Preview */}
        <div className="space-y-6">
          {messagePreview.length > 0 && currentMessage ? (
            <div className="rounded-xl p-4" style={{ backgroundColor: ds.bg.card, borderColor: ds.border.primary, borderWidth: '1px' }}>
              {/* Preview Header with Navigation */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5" style={{ color: ds.text.accent }} />
                  <div>
                    <p className="font-medium" style={{ color: ds.text.primary }}>
                      {currentMessage.influencerName}
                    </p>
                    <p className="text-sm" style={{ color: ds.text.secondary }}>
                      {currentMessage.email || 'メールアドレスなし'}
                    </p>
                  </div>
                </div>
                
                {messagePreview.length > 1 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigatePreview('prev')}
                      disabled={currentPreviewIndex === 0}
                      className="p-1 rounded transition-colors disabled:opacity-50"
                      style={{ color: ds.text.secondary }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm px-2" style={{ color: ds.text.secondary }}>
                      {currentPreviewIndex + 1} / {messagePreview.length}
                    </span>
                    <button
                      onClick={() => navigatePreview('next')}
                      disabled={currentPreviewIndex === messagePreview.length - 1}
                      className="p-1 rounded transition-colors disabled:opacity-50"
                      style={{ color: ds.text.secondary }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Editable Subject */}
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: ds.text.secondary }}>件名:</label>
                  <input
                    type="text"
                    value={editableSubject}
                    onChange={(e) => setEditableSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: ds.form.input.bg,
                      borderColor: ds.form.input.border,
                      color: ds.text.primary,
                      borderWidth: '1px',
                      borderStyle: 'solid'
                    }}
                  />
                </div>
                
                {/* Editable Body */}
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: ds.text.secondary }}>本文:</label>
                  <textarea
                    value={editableBody}
                    onChange={(e) => setEditableBody(e.target.value)}
                    rows={12}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 resize-none"
                    style={{
                      backgroundColor: ds.form.input.bg,
                      borderColor: ds.form.input.border,
                      color: ds.text.primary,
                      borderWidth: '1px',
                      borderStyle: 'solid'
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                {currentMessage.email && currentMessage.email.trim() ? (
                  <button
                    onClick={sendEmails}
                    disabled={sending || hasPlaceholder}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    style={{
                      backgroundColor: '#10b981',
                      color: 'white'
                    }}
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>送信</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={copyToClipboard}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors"
                      style={{
                        backgroundColor: ds.button.secondary.bg,
                        color: ds.button.secondary.text
                      }}
                    >
                      {copiedToClipboard ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span>{copiedToClipboard ? 'コピー済み' : 'テキストコピー'}</span>
                    </button>
                    <button
                      onClick={markAsSent}
                      disabled={markingAsSent}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                      style={{
                        backgroundColor: '#10b981',
                        color: 'white'
                      }}
                    >
                      {markingAsSent ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      <span>送信済み</span>
                    </button>
                  </>
                )}
              </div>
              {hasPlaceholder && (
                <p className="text-xs mt-2" style={{ color: '#b45309' }}>
                  名前が未入力です。件名・本文の「{NAME_PLACEHOLDER}」を実際の名前に編集してください。
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl p-8 text-center" style={{ backgroundColor: ds.bg.card, borderColor: ds.border.primary, borderWidth: '1px' }}>
              <Mail className="w-12 h-12 mx-auto mb-4" style={{ color: ds.text.secondary }} />
              <p className="text-lg font-medium mb-2" style={{ color: ds.text.primary }}>
                メッセージプレビュー
              </p>
              <p className="text-sm" style={{ color: ds.text.secondary }}>
                インフルエンサーを選択して「プレビュー生成」をクリックしてください
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}