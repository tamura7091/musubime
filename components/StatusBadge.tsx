import { CampaignStatus } from '@/types';
import { getStatusLabel, getStatusColor } from '@/lib/mock-data';

interface StatusBadgeProps {
  status: CampaignStatus;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span className={`status-badge ${getStatusColor(status)} ${className}`}>
      {getStatusLabel(status)}
    </span>
  );
}
