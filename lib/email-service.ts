// Email service for sending outreach emails
// This is a placeholder implementation that can be extended with actual email providers

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private fromEmail: string = 'partnerships_jp@usespeak.com';

  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    try {
      console.log('📧 Sending email:', {
        to: message.to,
        subject: message.subject,
        from: message.from || this.fromEmail,
        bodyLength: message.body.length
      });

      // TODO: Implement actual email sending
      // Options for implementation:
      // 1. SendGrid API
      // 2. AWS SES
      // 3. Nodemailer with SMTP
      // 4. Resend.com
      // 5. Postmark

      // For now, simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Log the email content for debugging
      console.log('📧 Email content:', {
        to: message.to,
        subject: message.subject,
        body: message.body.substring(0, 200) + '...'
      });

      // Simulate success
      return {
        success: true,
        messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

    } catch (error: any) {
      console.error('❌ Email sending failed:', error);
      return {
        success: false,
        error: error?.message || 'Failed to send email'
      };
    }
  }

  async sendBulkEmails(messages: EmailMessage[]): Promise<{
    success: boolean;
    results: EmailResult[];
    successCount: number;
    failureCount: number;
  }> {
    console.log('📧 Sending bulk emails:', messages.length, 'messages');

    const results: EmailResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    // Send emails sequentially to avoid rate limiting
    for (const message of messages) {
      const result = await this.sendEmail(message);
      results.push(result);
      
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }

      // Add small delay between emails
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('📧 Bulk email results:', { successCount, failureCount });

    return {
      success: successCount > 0,
      results,
      successCount,
      failureCount
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Email templates for different scenarios
export const createEmailFromTemplate = (
  influencerName: string,
  platform: string,
  outreachType: string,
  previousContact: boolean,
  teamMemberName: string,
  customMessage?: string
): { subject: string; body: string } => {
  const greeting = previousContact ? "お世話になっております" : "初めまして";
  
  if (customMessage) {
    return {
      subject: `スピークのPR依頼｜${influencerName}様`,
      body: customMessage
    };
  }

  // Use the same logic as in the API route
  if (outreachType === "1st time outreach") {
    if (platform === "tw") {
      return {
        subject: `スピークのPR依頼｜${influencerName}様`,
        body: `【英会話アプリのPR依頼】
${greeting}、AI英会話アプリ「スピーク」の${teamMemberName}と申します。 この度4月1日から行われるキャンペーン期間中にてPR投稿にご協力いただける形を募集しております。

首都圏・関西にて高畑充希さんを起用したテレビCMの再放送も予定しており、その一環としてぜひ、${influencerName}様にご協力いただきたいと考えております。

・投稿内容：今までに高いインプレッションを獲得した投稿フォーマットにてスピークを自然に入れ込む形でPR。リプ欄にリンクとPR内容を挿入。（例：https://x.com/mitsu7travel/status/1877882747529687422）
・投稿日希望：8月1日~8月3日

スケジュールがタイトとはなっていますが、以下の資料等をご覧の上ご判断いただきご興味がございましたらご希望の報酬をお聞かせいただけますでしょうか？

こちらの資料には今までのPRの経歴や詳細情報を記載しておりますので、ぜひお目通しいただければ幸いです：
・https://usespeak.notion.site/YouTube-1f3792ec2f108090b3fbe9b4051a4a4c?pvs=4

ご返信をお待ちしております。
※返信はCCも含め全員にお願いいたします。`
      };
    }
    // Add other platform templates here...
  }

  // Default template
  return {
    subject: `スピークのPR依頼｜${influencerName}様`,
    body: `${influencerName}様

${greeting}。
スピークチームの${teamMemberName}です。

[メッセージ内容]

よろしくお願いいたします。

ー
Speakeasy Labs, Inc.
${teamMemberName}`
  };
};
