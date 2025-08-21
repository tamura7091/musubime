'use client';

import { CampaignStatus } from '@/types';
import { useDesignSystem } from '@/hooks/useDesignSystem';

interface PreviousStepMessageProps {
  status: CampaignStatus | string;
}

const messages: Record<string, string> = {
  not_started: '🎉 ご参加ありがとうございます！まずは基本情報のご入力をお願いします。',
  meeting_scheduling: '✅ 基本情報のご入力ありがとうございます！打ち合わせのご予約にお進みください。',
  meeting_scheduled: '📅 ご予約ありがとうございます！当日のご参加をお願いします。',
  plan_creating: '🤝 打ち合わせありがとうございました！構成案の作成をお願いします。',
  plan_submitted: '📋 構成案のご提出ありがとうございます！ただいま確認中です。',
  plan_revising: '✏️ ご提出ありがとうございます！フィードバックに沿って修正をお願いします。',
  draft_creating: '🎊 素敵な構成案をありがとうございます！構成案に沿い、初稿作成にお進みください。',
  draft_submitted: '🎬 初稿のご提出ありがとうございます！ただいま確認中です。',
  draft_revising: '🔧 初稿修正のご対応をお願いします。',
  scheduling: '📱 初稿のご対応ありがとうございます！投稿準備をお願いします。',
  scheduled: '🚀 投稿ありがとうございます！送金手続きを進めます。',
  payment_processing: '💰 投稿ありがとうございました！送金手続きを開始しました。着金まで少々お待ちください。',
  completed: '🎉 ご協力ありがとうございました！プロモーションは完了しました。',
  cancelled: '😔 今回はご対応ありがとうございました。',
};

export default function PreviousStepMessage({ status }: PreviousStepMessageProps) {
  const ds = useDesignSystem();
  const message = messages[status] || '進捗ありがとうございます！次のステップにお進みください。';

  return (
    <p className="mobile-text" style={{ color: ds.text.primary }}>
      {message}
    </p>
  );
}


