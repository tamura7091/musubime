'use client';

import React, { useState, useEffect } from 'react';
import { useDesignSystem } from '@/hooks/useDesignSystem';
import { useAuth } from '@/contexts/AuthContext';
import { ChangeRequest, RequestStatus } from '@/types';
import { 
  FileText, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/**
 * 申請管理パネルコンポーネント
 * 管理者画面で使用し、インフルエンサーからの変更申請を表示・承認・却下します。
 */
export default function RequestsPanel() {
  const ds = useDesignSystem();
  const { user } = useAuth();
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('pending');
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [modalRequest, setModalRequest] = useState<ChangeRequest | null>(null);
  const [modalAction, setModalAction] = useState<'approved' | 'rejected'>('approved');
  const [adminComment, setAdminComment] = useState('');

  // 申請を取得
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/requests?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      } else {
        console.error('Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  // 申請の展開/折りたたみ
  const toggleExpanded = (requestId: string) => {
    const newExpanded = new Set(expandedRequests);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedRequests(newExpanded);
  };

  // 申請への対応（承認/却下）
  const handleRequestAction = async (request: ChangeRequest, action: 'approved' | 'rejected') => {
    setModalRequest(request);
    setModalAction(action);
    setAdminComment('');
    setShowResponseModal(true);
  };

  // モーダルで承認/却下を確定
  const confirmRequestAction = async () => {
    if (!modalRequest || !user) return;

    const requestId = modalRequest.id;
    setProcessingIds(prev => new Set(prev).add(requestId));
    setShowResponseModal(false);

    try {
      const response = await fetch('/api/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          status: modalAction,
          adminId: user.id,
          adminName: user.name,
          comment: adminComment || (modalAction === 'approved' ? '承認されました' : '却下されました'),
        }),
      });

      if (response.ok) {
        // 成功したら一覧を再取得
        await fetchRequests();
        alert(modalAction === 'approved' ? '申請を承認しました' : '申請を却下しました');
      } else {
        alert('申請の処理に失敗しました');
      }
    } catch (error) {
      console.error('Error handling request:', error);
      alert('エラーが発生しました');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
      setModalRequest(null);
      setAdminComment('');
    }
  };

  // 申請タイプのアイコンとラベル
  const getRequestTypeInfo = (type: string) => {
    switch (type) {
      case 'plan_date_change':
        return {
          icon: <FileText className="w-5 h-5" />,
          label: '構成案提出日変更',
          color: ds.text.accent,
        };
      case 'draft_date_change':
        return {
          icon: <FileText className="w-5 h-5" />,
          label: '初稿提出日変更',
          color: '#8b5cf6',
        };
      case 'live_date_change':
        return {
          icon: <Calendar className="w-5 h-5" />,
          label: '投稿日変更',
          color: '#f59e0b',
        };
      default:
        return {
          icon: <MessageSquare className="w-5 h-5" />,
          label: '変更申請',
          color: ds.text.secondary,
        };
    }
  };

  // ステータスのバッジ
  const getStatusBadge = (status: RequestStatus) => {
    const config = {
      pending: {
        label: '承認待ち',
        bg: '#fef3c7',
        text: '#92400e',
        icon: <Clock className="w-4 h-4" />,
      },
      approved: {
        label: '承認済み',
        bg: '#d1fae5',
        text: '#065f46',
        icon: <CheckCircle className="w-4 h-4" />,
      },
      rejected: {
        label: '却下',
        bg: '#fee2e2',
        text: '#991b1b',
        icon: <XCircle className="w-4 h-4" />,
      },
    };

    const { label, bg, text, icon } = config[status];

    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: bg, color: text }}
      >
        {icon}
        {label}
      </span>
    );
  };

  // フィルタリングされた申請
  const filteredRequests = statusFilter === 'all' 
    ? requests 
    : requests.filter(r => r.status === statusFilter);

  // 承認待ち件数
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin" style={{ color: ds.text.secondary }} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: ds.text.primary }}>
            変更申請管理
          </h2>
          {pendingCount > 0 && (
            <p className="text-sm mt-1" style={{ color: ds.text.secondary }}>
              {pendingCount}件の申請が承認待ちです
            </p>
          )}
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            backgroundColor: ds.bg.card,
            color: ds.text.primary,
            borderColor: ds.border.primary,
            borderWidth: '1px',
            borderStyle: 'solid',
          }}
        >
          <RefreshCw className="w-4 h-4" />
          更新
        </button>
      </div>

      {/* フィルター */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: statusFilter === status ? ds.button.primary.bg : ds.bg.card,
              color: statusFilter === status ? ds.button.primary.text : ds.text.primary,
              borderColor: ds.border.primary,
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
          >
            {status === 'all' ? 'すべて' : 
             status === 'pending' ? '承認待ち' :
             status === 'approved' ? '承認済み' : '却下'}
          </button>
        ))}
      </div>

      {/* 申請一覧 */}
      {filteredRequests.length === 0 ? (
        <div
          className="text-center py-12 rounded-xl"
          style={{
            backgroundColor: ds.bg.card,
            borderColor: ds.border.secondary,
            borderWidth: '1px',
            borderStyle: 'solid',
          }}
        >
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: ds.text.secondary }} />
          <p style={{ color: ds.text.secondary }}>申請がありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => {
            const typeInfo = getRequestTypeInfo(request.type);
            const isExpanded = expandedRequests.has(request.id);
            const isProcessing = processingIds.has(request.id);

            return (
              <div
                key={request.id}
                className="rounded-xl overflow-hidden transition-all"
                style={{
                  backgroundColor: ds.bg.card,
                  borderColor: ds.border.primary,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
              >
                {/* ヘッダー */}
                <div
                  className="p-4 cursor-pointer hover:bg-opacity-80 transition-colors"
                  style={{ backgroundColor: ds.bg.surface }}
                  onClick={() => toggleExpanded(request.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span style={{ color: typeInfo.color }}>
                        {typeInfo.icon}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold" style={{ color: ds.text.primary }}>
                            {request.title}
                          </h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm" style={{ color: ds.text.secondary }}>
                          {request.influencerName} · {new Date(request.createdAt).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" style={{ color: ds.text.secondary }} />
                    ) : (
                      <ChevronDown className="w-5 h-5" style={{ color: ds.text.secondary }} />
                    )}
                  </div>
                </div>

                {/* 詳細（展開時） */}
                {isExpanded && (
                  <div className="p-4 space-y-4">
                    {/* 申請理由 */}
                    {request.description && (
                      <div>
                        <h4 className="text-sm font-medium mb-2" style={{ color: ds.text.primary }}>
                          申請理由
                        </h4>
                        <p className="text-sm" style={{ color: ds.text.secondary }}>
                          {request.description}
                        </p>
                      </div>
                    )}

                    {/* 変更内容 */}
                    <div>
                      <h4 className="text-sm font-medium mb-2" style={{ color: ds.text.primary }}>
                        変更内容
                      </h4>
                      <div className="space-y-2">
                        {request.requestedChanges.map((change, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg"
                            style={{
                              backgroundColor: ds.bg.surface,
                              borderColor: ds.border.secondary,
                              borderWidth: '1px',
                              borderStyle: 'solid',
                            }}
                          >
                            {change.currentValue && (
                              <div className="mb-2">
                                <span className="text-xs font-medium" style={{ color: ds.text.secondary }}>
                                  現在:
                                </span>
                                <p className="text-sm mt-0.5" style={{ color: ds.text.primary }}>
                                  {change.currentValue}
                                </p>
                              </div>
                            )}
                            <div>
                              <span className="text-xs font-medium" style={{ color: ds.text.secondary }}>
                                変更後:
                              </span>
                              <p className="text-sm mt-0.5 font-medium" style={{ color: ds.text.accent }}>
                                {change.newValue}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 管理者の対応 */}
                    {request.adminResponse && (
                      <div
                        className="p-3 rounded-lg"
                        style={{
                          backgroundColor: request.status === 'approved' ? '#d1fae5' : '#fee2e2',
                          borderColor: request.status === 'approved' ? '#10b981' : '#ef4444',
                          borderWidth: '1px',
                          borderStyle: 'solid',
                        }}
                      >
                        <div className="flex items-start gap-2">
                          {request.status === 'approved' ? (
                            <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#065f46' }} />
                          ) : (
                            <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#991b1b' }} />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium mb-1" style={{ color: request.status === 'approved' ? '#065f46' : '#991b1b' }}>
                              {request.adminResponse.adminName}が{request.status === 'approved' ? '承認' : '却下'}しました
                            </p>
                            <p className="text-sm" style={{ color: request.status === 'approved' ? '#065f46' : '#991b1b' }}>
                              {request.adminResponse.comment}
                            </p>
                            <p className="text-xs mt-1" style={{ color: request.status === 'approved' ? '#047857' : '#7f1d1d' }}>
                              {new Date(request.adminResponse.respondedAt).toLocaleString('ja-JP')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* アクションボタン（承認待ちのみ） */}
                    {request.status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleRequestAction(request, 'approved')}
                          disabled={isProcessing}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
                          style={{
                            backgroundColor: '#10b981',
                            color: 'white',
                          }}
                        >
                          <CheckCircle className="w-4 h-4" />
                          承認
                        </button>
                        <button
                          onClick={() => handleRequestAction(request, 'rejected')}
                          disabled={isProcessing}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
                          style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                          }}
                        >
                          <XCircle className="w-4 h-4" />
                          却下
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 承認/却下確認モーダル */}
      {showResponseModal && modalRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowResponseModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl p-6"
            style={{
              backgroundColor: ds.bg.card,
              borderColor: ds.border.primary,
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: ds.text.primary }}>
              {modalAction === 'approved' ? '申請を承認' : '申請を却下'}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: ds.text.primary }}>
                コメント（任意）
              </label>
              <textarea
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                placeholder={modalAction === 'approved' ? '承認の理由や追加情報を記入...' : '却下の理由を記入...'}
                rows={3}
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: ds.form.input.bg,
                  borderColor: ds.form.input.border,
                  color: ds.text.primary,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={confirmRequestAction}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                style={{
                  backgroundColor: modalAction === 'approved' ? '#10b981' : '#ef4444',
                  color: 'white',
                }}
              >
                確定
              </button>
              <button
                onClick={() => setShowResponseModal(false)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                style={{
                  backgroundColor: ds.bg.surface,
                  color: ds.text.primary,
                  borderColor: ds.border.primary,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

