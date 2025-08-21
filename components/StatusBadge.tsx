import { CampaignStatus, getStepFromStatus } from '@/types';

const getStatusLabel = (status: CampaignStatus | string): string => {
  const map: Record<string, string> = {
    not_started: '未開始',
    meeting_scheduling: '打ち合わせ予約中',
    meeting_scheduled: '打ち合わせ予約済み',
    plan_creating: '構成案作成中',
    plan_submitted: '構成案確認中',
    plan_revising: '構成案修正中',
    draft_creating: '初稿作成中',
    draft_submitted: '初稿提出済み',
    draft_revising: '初稿修正中',
    scheduling: '投稿準備中',
    scheduled: '投稿済み',
    payment_processing: '送金手続き中',
    completed: 'PR完了',
    cancelled: 'PRキャンセル',
  };
  return map[status as string] || (status as string);
};

const getStatusColor = (status: CampaignStatus | string): string => {
  const map: Record<string, string> = {
    not_started: 'bg-gray-400/20 text-gray-500 border-gray-400/30',
    meeting_scheduling: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    meeting_scheduled: 'bg-blue-600/20 text-blue-300 border-blue-600/30',
    plan_creating: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    plan_submitted: 'bg-orange-600/20 text-orange-300 border-orange-600/30',
    plan_revising: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    draft_creating: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    draft_submitted: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    draft_revising: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    scheduling: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    scheduled: 'bg-green-600/20 text-green-300 border-green-600/30',
    payment_processing: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    completed: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return map[status as string] || 'bg-gray-500/20 text-gray-500 border-gray-500/30';
};

interface StatusBadgeProps {
  status: CampaignStatus | string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span className={`status-badge ${getStatusColor(status)} ${className}`}>
      {getStatusLabel(status)}
    </span>
  );
}
