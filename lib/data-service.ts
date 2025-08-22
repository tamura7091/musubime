import { Campaign, User, Update } from '@/types';
import { googleSheetsService } from './google-sheets';
// Removed demo data dependencies

class DataService {
  private useGoogleSheets: boolean;

  constructor() {
    // Use Google Sheets if credentials are available (both dev and production)
    const hasServiceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY;
    const hasApiKey = process.env.GOOGLE_SHEETS_API_KEY;
    this.useGoogleSheets = !!(hasServiceAccount || hasApiKey);
    
    console.log('🔧 DataService initialized');
    console.log('📊 Using Google Sheets:', this.useGoogleSheets);
    console.log('🔑 Has Service Account:', !!hasServiceAccount);
    console.log('🔑 Has API Key:', !!hasApiKey);
    console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
  }

  async getUsers(): Promise<User[]> {
    if (this.useGoogleSheets) {
      try {
        console.log('📊 Fetching users from Google Sheets...');
        const googleUsers = await googleSheetsService.getUsers();
        console.log('✅ Users fetched from Google Sheets:', googleUsers.length);
        return googleUsers.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.email?.includes('@usespeak.com') ? 'admin' as const : 'influencer' as const,
        }));
      } catch (error) {
        console.error('❌ Failed to fetch users from Google Sheets:', error);
        return [];
      }
    }
    
    console.log('📋 Google Sheets not configured; returning empty users list');
    return [];
  }

  async getCampaigns(): Promise<Campaign[]> {
    if (this.useGoogleSheets) {
      try {
        console.log('🎯 Fetching campaigns from Google Sheets...');
        const googleCampaigns = await googleSheetsService.getCampaigns();
        console.log('✅ Campaigns fetched from Google Sheets:', googleCampaigns.length);
        
        return googleCampaigns.map(campaign => ({
          id: campaign.id,
          title: campaign.title,
          influencerId: campaign.influencerId,
          influencerName: (campaign as any).influencerName || campaign.title,
          influencerAvatar: undefined, // Not available in basic sheet
          status: campaign.status as any,
          statusDashboard: (campaign as any).statusDashboard,
          platform: campaign.platform,
          contractedPrice: campaign.contractedPrice,
          currency: campaign.currency || 'JPY',
          createdAt: new Date(campaign.createdAt),
          updatedAt: new Date(campaign.updatedAt || campaign.createdAt),
          schedules: {
            meetingDate: campaign.schedules.meetingDate,
            planSubmissionDate: campaign.schedules.planSubmissionDate,
            draftSubmissionDate: campaign.schedules.draftSubmissionDate,
            liveDate: campaign.schedules.liveDate,
          },
          requirements: campaign.requirements,
          referenceLinks: campaign.referenceLinks.map(link => ({
            title: 'Reference',
            url: link
          })),
          notes: campaign.notes,
          campaignData: (campaign as any).campaignData,
        }));
      } catch (error) {
        console.error('❌ Failed to fetch campaigns from Google Sheets:', error);
        return [];
      }
    }
    
    console.log('📋 Google Sheets not configured; returning empty campaigns list');
    return [];
  }

  async getUserCampaigns(userId: string): Promise<Campaign[]> {
    if (this.useGoogleSheets) {
      try {
        console.log('🎯 Fetching campaigns for user from Google Sheets:', userId);
        const googleCampaigns = await googleSheetsService.getCampaigns(userId);
        console.log('✅ User campaigns fetched from Google Sheets:', googleCampaigns.length);
        
        return googleCampaigns.map(campaign => ({
          id: campaign.id,
          title: campaign.title,
          influencerId: campaign.influencerId,
          influencerName: (campaign as any).influencerName || campaign.title,
          influencerAvatar: undefined, // Not available in basic sheet
          status: campaign.status as any,
          statusDashboard: (campaign as any).statusDashboard,
          platform: campaign.platform,
          contractedPrice: campaign.contractedPrice,
          currency: campaign.currency || 'JPY',
          createdAt: new Date(campaign.createdAt),
          updatedAt: new Date(campaign.updatedAt || campaign.createdAt),
          schedules: {
            meetingDate: campaign.schedules.meetingDate,
            planSubmissionDate: campaign.schedules.planSubmissionDate,
            draftSubmissionDate: campaign.schedules.draftSubmissionDate,
            liveDate: campaign.schedules.liveDate,
          },
          requirements: campaign.requirements,
          referenceLinks: campaign.referenceLinks.map(link => ({
            title: 'Reference',
            url: link
          })),
          notes: campaign.notes,
          campaignData: (campaign as any).campaignData,
        }));
      } catch (error) {
        console.error('❌ Failed to fetch user campaigns from Google Sheets:', error);
        return [];
      }
    }
    
    console.log('📋 Google Sheets not configured; returning empty campaigns list for user:', userId);
    return [];
  }

    async getUpdates(): Promise<Update[]> {
    // Get updates directly from Google Sheets using date_status_updated and status_dashboard
    if (this.useGoogleSheets) {
      try {
        console.log('🔍 Fetching updates directly from Google Sheets...');
        
        // Get specific columns needed for updates including URLs for submissions
        const rawData = await googleSheetsService.getSpecificColumns([
          'id_campaign',
          'id_influencer', 
          'name',
          'status_dashboard',
          'date_status_updated',
          'url_plan',
          'url_draft',
          'url_content',
          'message_dashboard'
        ]);
        
        console.log(`📊 Fetched ${rawData.length} rows from Google Sheets for updates`);
        
        const updates: Update[] = [];
        
        // Process each row that has both date_status_updated and status_dashboard
        rawData.forEach((row, index) => {
          const campaignId = row['id_campaign'];
          const influencerId = row['id_influencer'];
          const influencerName = row['name'];
          const statusDashboard = row['status_dashboard'];
          const dateStatusUpdated = row['date_status_updated'];
          const urlPlan = row['url_plan'];
          const urlDraft = row['url_draft'];
          const urlContent = row['url_content'];
          
          // Skip rows without essential data
          if (!campaignId || !influencerId || !statusDashboard || !dateStatusUpdated) {
            if (index < 5) { // Debug first 5 rows
              console.log(`⚠️ Skipping row ${index + 1} - missing data:`, {
                campaignId: !!campaignId,
                influencerId: !!influencerId,
                statusDashboard: !!statusDashboard,
                dateStatusUpdated: !!dateStatusUpdated
              });
            }
            return;
          }
          
          // Parse the date_status_updated
          let updateDate: Date;
          try {
            updateDate = new Date(dateStatusUpdated);
            if (isNaN(updateDate.getTime())) {
              console.log(`⚠️ Invalid date_status_updated for campaign ${campaignId}: "${dateStatusUpdated}"`);
              return;
            }
          } catch (error) {
            console.log(`⚠️ Error parsing date_status_updated for campaign ${campaignId}: "${dateStatusUpdated}"`);
            return;
          }
          
          // Map the status_dashboard to our internal status and generate message
          const mappedStatus = googleSheetsService.mapStatus(statusDashboard);
          let updateMessage = '';
          let updateType: 'submission' | 'status_change' | 'approval' = 'status_change';
          let submissionUrl: string | undefined;
          let submissionType: 'plan' | 'draft' | 'content' | undefined;
          let requiresAdminAction = false;
          let actionType: 'approve_plan' | 'revise_plan' | 'approve_draft' | 'revise_draft' | undefined;
          
          console.log(`🔍 Processing update for ${campaignId}: status_dashboard="${statusDashboard}" -> mapped="${mappedStatus}"`);
          
          // Generate update message based on mapped status
          switch (mappedStatus) {
            case 'plan_submitted':
              updateMessage = `${influencerName}さんから構成案が提出されました`;
              updateType = 'submission';
              submissionUrl = urlPlan;
              submissionType = 'plan';
              requiresAdminAction = true;
              actionType = 'approve_plan';
              break;
            case 'plan_revising':
              updateMessage = `${influencerName}さんの構成案を修正中です`;
              updateType = 'approval';
              break;
            case 'draft_submitted':
              updateMessage = `${influencerName}さんから初稿が提出されました`;
              updateType = 'submission';
              submissionUrl = urlDraft;
              submissionType = 'draft';
              requiresAdminAction = true;
              actionType = 'approve_draft';
              break;
            case 'draft_revising':
              updateMessage = `${influencerName}さんの初稿を修正中です`;
              updateType = 'approval';
              break;
            case 'scheduling':
              updateMessage = `${influencerName}さんのコンテンツ投稿準備中です`;
              updateType = 'status_change';
              break;
            case 'scheduled':
              updateMessage = `${influencerName}さんのコンテンツが投稿されました！`;
              updateType = 'status_change';
              submissionUrl = urlContent;
              submissionType = 'content';
              break;
            case 'payment_processing':
              updateMessage = `${influencerName}さんのステータスが「送金手続き中」に更新されました`;
              updateType = 'status_change';
              submissionUrl = urlContent;
              submissionType = 'content';
              break;
            case 'completed':
              updateMessage = `${influencerName}さんのプロモーションが完了しました`;
              updateType = 'status_change';
              break;
            case 'cancelled':
              updateMessage = `${influencerName}さんのプロモーションがキャンセルされました`;
              updateType = 'status_change';
              break;
            default:
              // Map status to natural Japanese for the default case
              const statusMap: { [key: string]: string } = {
                'not_started': '未開始',
                'meeting_scheduling': '打ち合わせ予約中',
                'meeting_scheduled': '打ち合わせ予定',
                'contract_pending': '契約書待ち',
                'plan_creating': '構成案作成中',
                'plan_submitted': '構成案確認中',
                'plan_revising': '構成案修正中',
                'draft_creating': '初稿作成中',
                'draft_submitted': '初稿提出済み',
                'draft_revising': '初稿修正中',
                'scheduling': '投稿準備中',
                'scheduled': '投稿済み',
                'payment_processing': '送金手続き中',
                'completed': '完了',
                'cancelled': 'キャンセル'
              };
              const japaneseStatus = statusMap[mappedStatus] || mappedStatus;
              updateMessage = `${influencerName}さんのステータスが「${japaneseStatus}」に更新されました`;
              updateType = 'status_change';
          }
          
          updates.push({
            id: `update_${campaignId}_${mappedStatus}_${dateStatusUpdated}`,
            message: updateMessage,
            timestamp: updateDate,
            type: updateType,
            campaignId: campaignId,
            influencerId: influencerId,
            influencerName: influencerName || 'Unknown',
            submissionUrl: submissionUrl,
            submissionType: submissionType,
            currentStatus: mappedStatus,
            requiresAdminAction: requiresAdminAction,
            actionType: actionType,
          });
          
          console.log(`✅ Created update: ${updateMessage} (${dateStatusUpdated})`);
        });
        
        // Sort by timestamp (newest first) and return latest 10 updates
        const sortedUpdates = updates
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10);
        
        console.log(`✅ Generated ${sortedUpdates.length} updates from Google Sheets`);
        console.log('📊 Latest updates:', sortedUpdates.map(u => ({
          message: u.message,
          timestamp: u.timestamp,
          rawStatus: u.id.split('_')[2] // Extract original status from ID
        })));
        
        return sortedUpdates;
      } catch (error) {
        console.error('❌ Failed to generate updates from Google Sheets:', error);
        return [];
      }
    }
    
    return [];
  }

  async createUpdate(updateData: {
    campaignId: string;
    influencerId: string;
    influencerName: string;
    type: 'submission' | 'status_change' | 'approval';
    message: string;
  }): Promise<Update> {
    const update: Update = {
      id: `update_${updateData.campaignId}_${Date.now()}`,
      campaignId: updateData.campaignId,
      influencerId: updateData.influencerId,
      influencerName: updateData.influencerName,
      type: updateData.type,
      message: updateData.message,
      timestamp: new Date()
    };

    // In a real implementation, you would store this in a database
    // For now, we'll just return the update object
    console.log('📝 Created update:', update);
    return update;
  }

  // Method to refresh data (useful for development/testing)
  async refreshData() {
    if (this.useGoogleSheets) {
      // In a real implementation, you might want to clear caches here
      console.log('Refreshing data from Google Sheets...');
    }
  }

  // Check if we're using real Google Sheets data
  isUsingGoogleSheets(): boolean {
    return this.useGoogleSheets;
  }
}

// Export singleton instance
export const dataService = new DataService();
