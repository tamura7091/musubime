'use client';

import { useAuth } from '@/contexts/AuthContext';
import { mockCampaigns } from '@/lib/mock-data';
import CampaignCard from '@/components/CampaignCard';
import StatusSection from '@/components/StatusSection';
import { TrendingUp, Clock, CheckCircle, Calendar, ExternalLink, Settings, Bug, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { CampaignStatus } from '@/types';

export default function InfluencerDashboard() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState(mockCampaigns);
  const [showDebugCard, setShowDebugCard] = useState(false);
  const [paymentCheckboxes, setPaymentCheckboxes] = useState<{[key: string]: {invoice: boolean, form: boolean}}>({});
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [urlInputs, setUrlInputs] = useState<{[key: string]: string}>({});
  
  if (!user || user.role !== 'influencer') {
    return <div>アクセスが拒否されました</div>;
  }

  const userCampaigns = campaigns.filter(campaign => campaign.influencerId === user.id);
  const activeCampaigns = userCampaigns.filter(campaign => 
    !['completed', 'cancelled'].includes(campaign.status)
  );
  const completedCampaigns = userCampaigns.filter(campaign => 
    campaign.status === 'completed'
  );

  const totalEarnings = userCampaigns
    .filter(campaign => campaign.status === 'completed')
    .reduce((sum, campaign) => sum + (campaign.contractedPrice || 0), 0);

  const pendingActions = activeCampaigns.filter(campaign => 
    ['plan_submission', 'content_creation', 'ready_to_publish'].includes(campaign.status)
  ).length;

  // Calculate progress percentage
  const calculateProgress = (campaign: any) => {
    const stepOrder = [
      'meeting_scheduled', 'plan_submission', 'plan_review',
      'content_creation', 'draft_submitted', 'draft_review', 'ready_to_publish',
      'live', 'payment_processing', 'completed'
    ];
    
    // Map revision statuses to their corresponding review statuses for progress calculation
    let statusForProgress = campaign.status;
    if (campaign.status === 'plan_revision') {
      statusForProgress = 'plan_review';
    } else if (campaign.status === 'draft_revision') {
      statusForProgress = 'draft_review';
    }
    
    const currentIndex = stepOrder.indexOf(statusForProgress);
    return Math.round((currentIndex / (stepOrder.length - 1)) * 100);
  };

  // Show 100% progress if no active campaigns (no promo ongoing)
  const overallProgress = activeCampaigns.length === 0 
    ? 100 
    : userCampaigns.length > 0 
      ? Math.round(userCampaigns.reduce((sum, campaign) => sum + calculateProgress(campaign), 0) / userCampaigns.length)
      : 0;

  // Get the most active campaign for status display
  const primaryCampaign = activeCampaigns[0] || userCampaigns[0];

  // Handle meeting completion checkbox
  const handleMeetingCompleted = (campaignId: string) => {
    setCampaigns(prevCampaigns => 
      prevCampaigns.map(campaign => 
        campaign.id === campaignId 
          ? { ...campaign, meetingCompleted: !campaign.meetingCompleted }
          : campaign
      )
    );
  };

  const handleMeetingStatusChange = (campaignId: string, status: 'not_scheduled' | 'scheduled' | 'completed') => {
    const confirmMessage = `ステータスを「${status === 'not_scheduled' ? '予約未完了' : status === 'scheduled' ? '予約済み' : '打ち合わせ完了'}」に変更しますか？`;
    
    if (window.confirm(confirmMessage)) {
      setCampaigns(prevCampaigns => 
        prevCampaigns.map(campaign => 
          campaign.id === campaignId 
            ? { ...campaign, meetingStatus: status }
            : campaign
        )
      );
    }
  };

  const handlePaymentCheckbox = (campaignId: string, type: 'invoice' | 'form', checked: boolean) => {
    // Prevent multiple popups
    if (isProcessingPayment) return;
    
    setPaymentCheckboxes(prev => {
      const current = prev[campaignId] || { invoice: false, form: false };
      const updated = { ...current, [type]: checked };
      
      // If both checkboxes are checked, change status to payment_processing
      if (updated.invoice && updated.form && !isProcessingPayment) {
        setIsProcessingPayment(true);
        
        if (window.confirm('両方の項目が完了しました。ステータスを「送金手続き中」に変更しますか？')) {
          setCampaigns(prevCampaigns => 
            prevCampaigns.map(campaign => 
              campaign.id === campaignId 
                ? { ...campaign, status: 'payment_processing' }
                : campaign
            )
          );
        } else {
          // If user cancels, uncheck the checkbox
          setIsProcessingPayment(false);
          return { ...prev, [campaignId]: { ...current, [type]: false } };
        }
        
        setIsProcessingPayment(false);
      }
      
      return { ...prev, [campaignId]: updated };
    });
  };

  const handleUrlSubmission = (campaignId: string, currentStatus: string) => {
    const url = urlInputs[campaignId] || '';
    
    if (!url.trim()) {
      alert('URLを入力してください');
      return;
    }

    // Define status transitions
    const statusTransitions: {[key: string]: {nextStatus: string, confirmMessage: string}} = {
      'plan_submission': {
        nextStatus: 'plan_review',
        confirmMessage: '構成案を提出しますか？'
      },
      'plan_revision': {
        nextStatus: 'plan_review',
        confirmMessage: '修正版構成案を提出しますか？'
      },
      'content_creation': {
        nextStatus: 'draft_submitted',
        confirmMessage: '初稿を提出しますか？'
      },
      'draft_revision': {
        nextStatus: 'draft_review',
        confirmMessage: '修正版初稿を提出しますか？'
      },
      'draft_review': {
        nextStatus: 'ready_to_publish',
        confirmMessage: '修正版を提出しますか？'
      },
      'ready_to_publish': {
        nextStatus: 'live',
        confirmMessage: 'コンテンツをスケジュールしますか？'
      }
    };

    const transition = statusTransitions[currentStatus];
    if (!transition) return;

    if (window.confirm(transition.confirmMessage)) {
      setCampaigns(prevCampaigns => 
        prevCampaigns.map(campaign => 
          campaign.id === campaignId 
            ? { ...campaign, status: transition.nextStatus as CampaignStatus }
            : campaign
        )
      );
      
      // Clear the URL input
      setUrlInputs(prev => ({ ...prev, [campaignId]: '' }));
    }
  };

  // Handle status change for debug
  const handleStatusChange = (campaignId: string, newStatus: CampaignStatus) => {
    setCampaigns(prevCampaigns => 
      prevCampaigns.map(campaign => 
        campaign.id === campaignId 
          ? { ...campaign, status: newStatus }
          : campaign
      )
    );
  };

  // Get status options for debug dropdown
  const getStatusOptions = (): { value: CampaignStatus; label: string }[] => [
    { value: 'meeting_scheduled', label: '打ち合わせ予定' },
    { value: 'plan_submission', label: '構成案提出待ち' },
    { value: 'plan_revision', label: '構成案修正待ち' },
    { value: 'plan_review', label: '構成案確認中' },
    { value: 'content_creation', label: 'コンテンツ制作中' },
    { value: 'draft_submitted', label: '初稿提出済み' },
    { value: 'draft_revision', label: '初稿修正待ち' },
    { value: 'draft_review', label: '初稿確認中' },
    { value: 'ready_to_publish', label: '投稿準備完了' },
    { value: 'live', label: '投稿済み' },
    { value: 'payment_processing', label: '送金手続き中' },
    { value: 'completed', label: '完了' },
    { value: 'cancelled', label: 'キャンセル' }
  ];

  // Get action needed for a campaign
  const getActionNeeded = (campaign: any) => {
    switch (campaign.status) {
      case 'meeting_scheduled':
        // Dynamic title based on meeting status
        let meetingTitle = '打ち合わせの予約';
        if (campaign.meetingStatus === 'scheduled') {
          meetingTitle = '打ち合わせへの参加';
        } else if (campaign.meetingStatus === 'completed') {
          // Show plan submission action instead
          return {
            title: '構成案の提出',
            description: 'プロモーションの構成案をご提出ください',
            icon: AlertCircle,
            color: 'blue',
            action: 'plan',
            inputType: 'url'
          };
        }
        
        // Dynamic description based on meeting status
        let meetingDescription = '打ち合わせリンクから打ち合わせを予約し、以下のステータスを変更してください';
        if (campaign.meetingStatus === 'scheduled') {
          meetingDescription = '打ち合わせリンクから打ち合わせに参加し、以下のステータスを変更してください';
        }
        
        return {
          title: meetingTitle,
          description: meetingDescription,
          icon: Calendar,
          color: 'blue',
          action: 'meeting',
          inputType: 'meeting'
        };

              case 'plan_submission':
          return {
            title: '構成案の提出',
            description: 'プロモーションの構成案をご提出ください',
            icon: AlertCircle,
            color: 'blue',
            action: 'plan',
            inputType: 'url'
          };
        case 'plan_revision':
          return {
            title: '構成案の修正',
            description: 'フィードバックに基づいて構成案を修正し、再提出してください',
            icon: AlertCircle,
            color: 'blue',
            action: 'plan_revision',
            inputType: 'url'
          };
      case 'content_creation':
        return {
          title: '初稿の提出',
          description: '構成案に基づいてコンテンツを制作し、完成した動画のURLを共有してください',
          icon: AlertCircle,
          color: 'blue',
          action: 'content',
          inputType: 'url'
        };
              case 'draft_revision':
          return {
            title: '初稿の修正',
            description: 'フィードバックに基づいて初稿を修正し、再提出してください',
            icon: AlertCircle,
            color: 'blue',
            action: 'draft_revision',
            inputType: 'url'
          };
        case 'draft_review':
          return {
            title: '修正依頼',
            description: 'フィードバックに基づいて修正を行ってください',
            icon: AlertCircle,
            color: 'blue',
            action: 'revision',
            inputType: 'url'
          };
      case 'ready_to_publish':
        return {
          title: 'コンテンツのスケジュール',
          description: '承認されたコンテンツをスケジュールしてください',
          icon: AlertCircle,
          color: 'blue',
          action: 'publish',
          inputType: 'url'
        };
      case 'live':
        return {
          title: 'お支払いフォームの提出',
          description: '投稿完了後、お支払いフォームをご提出ください',
          icon: AlertCircle,
          color: 'blue',
          action: 'payment',
          inputType: 'payment'
        };
      case 'payment_processing':
        return {
          title: 'アクション不要：送金手続き中',
          description: '通常2-3週間で着金します。恐れ入りますが着金が確認できない場合はpartnerships_jp@usespeak.comまでご連絡ください。',
          icon: CheckCircle,
          color: 'gray',
          action: 'waiting',
          inputType: 'none'
        };
      case 'completed':
        return {
          title: 'アクション不要：完了',
          description: 'このキャンペーンは完了しました。お疲れ様でした！',
          icon: CheckCircle,
          color: 'gray',
          action: 'completed',
          inputType: 'none'
        };
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-7xl mx-auto mobile-padding">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-dark-text">
              お疲れ様です、{user.name}さん
            </h1>
            {/* Debug Toggle Button */}
            <button
              onClick={() => setShowDebugCard(!showDebugCard)}
              className="flex items-center space-x-2 bg-dark-accent/20 hover:bg-dark-accent/30 text-dark-accent px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Bug size={16} />
              <span>デバッグ</span>
            </button>
          </div>
          <p className="text-dark-text-secondary mobile-text">
            プロモーションの進捗状況と次のステップをご確認ください
          </p>
        </div>

        {/* Debug Card */}
        {showDebugCard && (
          <div className="mb-6 sm:mb-8">
            <div className="card border-2 border-orange-500/30 bg-orange-500/5">
              <div className="flex items-center space-x-2 mb-4">
                <Settings className="text-orange-400" size={20} />
                <h2 className="text-lg font-semibold text-dark-text">デバッグモード</h2>
              </div>
              <p className="text-sm text-dark-text-secondary mb-4">
                デモ用アカウントでのみ表示されます。キャンペーンのステータスを変更してテストできます。
              </p>
              
              {activeCampaigns.length > 0 ? (
                <div className="space-y-3">
                  {activeCampaigns.map(campaign => (
                    <div key={campaign.id} className="flex items-center space-x-3 p-3 bg-dark-bg rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark-text truncate">
                          {campaign.title}
                        </p>
                        <p className="text-xs text-dark-text-secondary">
                          現在: {campaign.status}
                        </p>
                      </div>
                      <select
                        value={campaign.status}
                        onChange={(e) => handleStatusChange(campaign.id, e.target.value as CampaignStatus)}
                        className="text-sm bg-dark-bg border border-dark-border rounded px-2 py-1 text-dark-text focus:outline-none focus:ring-2 focus:ring-dark-accent"
                      >
                        {getStatusOptions().map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-dark-text-secondary">
                  アクティブなキャンペーンがありません
                </p>
              )}
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="mobile-grid mb-6 sm:mb-8">
          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-dark-accent/20 rounded-lg flex-shrink-0">
                <TrendingUp className="text-dark-accent" size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-dark-text">
                  ¥{totalEarnings.toLocaleString()}
                </p>
                <p className="text-dark-text-secondary text-xs sm:text-sm">総報酬額</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-500/20 rounded-lg flex-shrink-0">
                <Clock className="text-orange-400" size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-dark-text">
                  {pendingActions}
                </p>
                <p className="text-dark-text-secondary text-xs sm:text-sm">要対応</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg flex-shrink-0">
                <CheckCircle className="text-green-400" size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-dark-text">
                  {overallProgress}%
                </p>
                <p className="text-dark-text-secondary text-xs sm:text-sm">進行状況</p>
              </div>
            </div>
          </div>
      </div>

        {/* Action Section */}
        {primaryCampaign && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-dark-text mb-4 sm:mb-6">
              対応が必要なステップ
            </h2>
            <div className="card">
              {(() => {
                const action = getActionNeeded(primaryCampaign);
                
                if (!action) {
                  // Special case for draft_submitted status
                  if (primaryCampaign.status === 'draft_submitted') {
                    return (
                      <div className="flex items-start space-x-4">
                        <div className="p-3 rounded-lg flex-shrink-0 bg-gray-500/20 text-gray-400 border-gray-500/30">
                          <CheckCircle size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-dark-text mb-2">
                            アクション不要：初稿確認中
                          </h3>
                          <p className="text-dark-text-secondary">
                            初稿の確認を行っています。フィードバックをお待ちください。
                          </p>
                        </div>
                      </div>
                    );
                  }
                  
                  // Special case for plan_review status
                  if (primaryCampaign.status === 'plan_review') {
                    return (
                      <div className="flex items-start space-x-4">
                        <div className="p-3 rounded-lg flex-shrink-0 bg-gray-500/20 text-gray-400 border-gray-500/30">
                          <CheckCircle size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-dark-text mb-2">
                            アクション不要：構成案確認中
                          </h3>
                          <p className="text-dark-text-secondary">
                            構成案の確認を行っています。フィードバックをお待ちください。
                          </p>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="flex items-start space-x-4">
                      <div className="p-3 rounded-lg flex-shrink-0 bg-gray-500/20 text-gray-400 border-gray-500/30">
                        <CheckCircle size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-dark-text mb-2">
                          アクション不要
                        </h3>
                        <p className="text-dark-text-secondary">
                          現在、アクションは必要ありません。次のステップをお待ちください。
                        </p>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-lg flex-shrink-0 bg-blue-500/20 text-blue-400 border-blue-500/30">
                      <action.icon size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-dark-text mb-2">
                        {action.title}
                      </h3>
                      <p className="text-dark-text-secondary mb-4">
                        {action.description}
                      </p>
                      
                      {/* Input Section based on inputType */}
                      {action.inputType === 'meeting' && (
                        <div className="space-y-4">
                          {primaryCampaign.meetingLink && (
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <a
                                  href={primaryCampaign.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 underline"
                                >
                                  打ち合わせリンク
                                </a>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-dark-text-secondary">ステータス:</span>
                            <select
                              value={primaryCampaign.meetingStatus || 'not_scheduled'}
                              onChange={(e) => handleMeetingStatusChange(primaryCampaign.id, e.target.value as 'not_scheduled' | 'scheduled' | 'completed')}
                              className="px-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-sm text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="not_scheduled" className="bg-dark-bg text-dark-text">予約未完了</option>
                              <option value="scheduled" className="bg-dark-bg text-dark-text">予約済み</option>
                              <option value="completed" className="bg-dark-bg text-dark-text">打ち合わせ完了</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {action.inputType === 'checkbox' && (
                        <div className="flex items-center justify-end">
                          <label className="flex items-center space-x-3 text-sm text-dark-text-secondary cursor-pointer">
                            <span>完了</span>
                            <input
                              type="checkbox"
                              className="w-6 h-6 text-blue-500 bg-dark-bg border-dark-border rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </label>
                        </div>
                      )}

                      {action.inputType === 'url' && (
                        <div className="space-y-4">
                          {action.title === 'コンテンツのスケジュール' && (
                            <div className="space-y-3">
                              <label className="flex items-center space-x-3 text-sm text-dark-text-secondary cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="w-5 h-5 text-blue-500 bg-dark-bg border-dark-border rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <span>指定の内容を概要欄に追加済み</span>
                              </label>
                              <label className="flex items-center space-x-3 text-sm text-dark-text-secondary cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="w-5 h-5 text-blue-500 bg-dark-bg border-dark-border rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <span>指定の内容を固定コメントに追加済み</span>
                              </label>
                            </div>
                          )}
                          <div className="flex items-center space-x-3">
                            <input
                              type="url"
                              placeholder="URLを入力してください"
                              value={urlInputs[primaryCampaign.id] || ''}
                              onChange={(e) => setUrlInputs(prev => ({ ...prev, [primaryCampaign.id]: e.target.value }))}
                              className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button 
                              onClick={() => handleUrlSubmission(primaryCampaign.id, primaryCampaign.status)}
                              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              提出
                            </button>
                          </div>
                        </div>
                      )}

                      {action.inputType === 'payment' && (
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <label className="flex items-center space-x-3 text-sm text-dark-text-secondary cursor-pointer">
                              <input
                                type="checkbox"
                                checked={paymentCheckboxes[primaryCampaign.id]?.invoice || false}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    if (window.confirm('請求書の作成が完了しましたか？')) {
                                      handlePaymentCheckbox(primaryCampaign.id, 'invoice', true);
                                    } else {
                                      e.target.checked = false;
                                    }
                                  } else {
                                    handlePaymentCheckbox(primaryCampaign.id, 'invoice', false);
                                  }
                                }}
                                className="w-5 h-5 text-blue-500 bg-dark-bg border-dark-border rounded focus:ring-blue-500 focus:ring-2"
                              />
                              <span>こちらのテンプレートで請求書を作成</span>
                            </label>
                            <label className="flex items-center space-x-3 text-sm text-dark-text-secondary cursor-pointer">
                              <input
                                type="checkbox"
                                checked={paymentCheckboxes[primaryCampaign.id]?.form || false}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    if (window.confirm('お支払いフォームの提出が完了しましたか？')) {
                                      handlePaymentCheckbox(primaryCampaign.id, 'form', true);
                                    } else {
                                      e.target.checked = false;
                                    }
                                  } else {
                                    handlePaymentCheckbox(primaryCampaign.id, 'form', false);
                                  }
                                }}
                                className="w-5 h-5 text-blue-500 bg-dark-bg border-dark-border rounded focus:ring-blue-500 focus:ring-2"
                              />
                              <span>こちらのフォームを提出</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {action.inputType === 'none' && (
                        <div className="text-sm text-dark-text-secondary">
                          {/* No input needed for completed/waiting states */}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Status Section */}
        {primaryCampaign && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-dark-text mb-4 sm:mb-6">
              ステータス
            </h2>
            <StatusSection campaign={primaryCampaign} />
          </div>
        )}

        {/* Active Campaigns */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-dark-text mb-4">
            プロモーション詳細
          </h2>
          {activeCampaigns.length > 0 ? (
            <div className="space-y-4">
              {activeCampaigns.map(campaign => (
                <div key={campaign.id} className="card">
                  {/* Always expanded for influencer view */}
                  <div className="mobile-flex mb-4">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="text-base sm:text-lg flex-shrink-0">
                        {campaign.platform === 'youtube_long' && '🎥'}
                        {campaign.platform === 'youtube_short' && '📱'}
                        {campaign.platform === 'instagram_reel' && '📸'}
                        {campaign.platform === 'tiktok' && '🎵'}
                        {campaign.platform === 'x_twitter' && '🐦'}
                        {campaign.platform === 'podcast' && '🎙️'}
                        {campaign.platform === 'blog' && '✍️'}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-dark-text font-medium mobile-text truncate">
                          {campaign.title}
                        </h3>
                        <p className="text-dark-text-secondary text-xs sm:text-sm">
                          {campaign.platform === 'youtube_long' && 'YouTube長編'}
                          {campaign.platform === 'youtube_short' && 'YouTubeショート'}
                          {campaign.platform === 'instagram_reel' && 'Instagramリール'}
                          {campaign.platform === 'tiktok' && 'TikTok'}
                          {campaign.platform === 'x_twitter' && 'X (Twitter)'}
                          {campaign.platform === 'podcast' && 'ポッドキャスト'}
                          {campaign.platform === 'blog' && 'ブログ'}
                        </p>
                      </div>
                    </div>
                  
                    <div className={`status-badge flex-shrink-0 ${
                      campaign.status === 'meeting_scheduled' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                      campaign.status === 'contract_pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      campaign.status === 'plan_submission' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                      campaign.status === 'plan_review' ? 'bg-orange-600/20 text-orange-300 border-orange-600/30' :
                      campaign.status === 'content_creation' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                      campaign.status === 'draft_submitted' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' :
                      campaign.status === 'draft_review' ? 'bg-indigo-600/20 text-indigo-300 border-indigo-600/30' :
                      campaign.status === 'ready_to_publish' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      campaign.status === 'live' ? 'bg-green-600/20 text-green-300 border-green-600/30' :
                      campaign.status === 'payment_processing' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                      'bg-gray-500/20 text-gray-400 border-gray-500/30'
                    }`}>
                    {campaign.status === 'meeting_scheduled' && '打ち合わせ予定'}
                    {campaign.status === 'contract_pending' && '契約書待ち'}
                    {campaign.status === 'plan_submission' && '構成案提出待ち'}
                    {campaign.status === 'plan_review' && '構成案確認中'}
                    {campaign.status === 'content_creation' && 'コンテンツ制作中'}
                    {campaign.status === 'draft_submitted' && '初稿提出済み'}
                    {campaign.status === 'draft_review' && '初稿確認中'}
                    {campaign.status === 'ready_to_publish' && '投稿準備完了'}
                    {campaign.status === 'live' && '投稿済み'}
                    {campaign.status === 'payment_processing' && '送金手続き中'}
                    {campaign.status === 'completed' && '完了'}
                    {campaign.status === 'cancelled' && 'キャンセル'}
                  </div>
                </div>

                {/* Always show expanded content */}
                <div className="space-y-4">
                  {/* Price and Next Step */}
                  <div className="mobile-grid gap-4">
                    <div className="flex items-center space-x-2 text-xs sm:text-sm">
                      <span className="text-dark-text font-medium">
                        ¥{(campaign.contractedPrice || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm">
                      <p className="font-medium text-dark-text mb-1">Next:</p>
                      <p className="text-dark-text-secondary">
                        {campaign.status === 'meeting_scheduled' && '打ち合わせにご参加ください'}
                        {campaign.status === 'contract_pending' && '契約書をご確認・サインしてください'}
                        {campaign.status === 'plan_submission' && '構成案をご提出ください'}
                        {campaign.status === 'plan_review' && '構成案の確認をお待ちください'}
                        {campaign.status === 'content_creation' && 'コンテンツの制作を開始してください'}
                        {campaign.status === 'draft_submitted' && '初稿の確認をお待ちください'}
                        {campaign.status === 'draft_review' && '修正があれば対応してください'}
                        {campaign.status === 'ready_to_publish' && 'コンテンツを投稿してください'}
                        {campaign.status === 'live' && '送金手続きをお待ちください'}
                        {campaign.status === 'payment_processing' && 'お支払い処理中です'}
                        {campaign.status === 'completed' && 'プロモーション完了'}
                      </p>
                    </div>
                  </div>

                  {/* Requirements */}
                  {campaign.requirements.length > 0 && (
                    <div>
                      <p className="font-medium text-dark-text mb-2">要件</p>
                      <ul className="space-y-1 text-sm text-dark-text-secondary">
                        {campaign.requirements.map((req, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-dark-accent mt-1">•</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Reference Links */}
                  {campaign.referenceLinks.length > 0 && (
                    <div>
                      <p className="font-medium text-dark-text mb-2">参考リンク</p>
                      <div className="space-y-1">
                        {campaign.referenceLinks.map((link, index) => (
                          <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-sm text-dark-accent hover:text-dark-accent-hover transition-colors"
                          >
                            <span>{link.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-8">
            <p className="text-dark-text-secondary">
              現在進行中のプロモーションはありません
            </p>
          </div>
        )}
      </div>

        {/* Completed Campaigns */}
        {completedCampaigns.length > 0 && (
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-dark-text mb-4">
              完了済みプロモーション
            </h2>
          <div className="space-y-4">
            {completedCampaigns.map(campaign => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}