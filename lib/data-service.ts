import { Campaign, User, Update } from '@/types';
import { googleSheetsService } from './google-sheets';
import { mockCampaigns, mockUsers } from './mock-data';

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
        console.error('❌ Failed to fetch users from Google Sheets, falling back to mock data:', error);
        return mockUsers;
      }
    }
    
    console.log('📋 Using mock users data');
    return mockUsers;
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
          platform: campaign.platform as any,
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
        console.error('❌ Failed to fetch campaigns from Google Sheets, falling back to mock data:', error);
        return mockCampaigns;
      }
    }
    
    console.log('📋 Using mock campaigns data');
    return mockCampaigns;
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
          platform: campaign.platform as any,
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
        console.error('❌ Failed to fetch user campaigns from Google Sheets, falling back to mock data:', error);
        return mockCampaigns.filter(campaign => campaign.influencerId === userId);
      }
    }
    
    console.log('📋 Using mock campaigns data for user:', userId);
    return mockCampaigns.filter(campaign => campaign.influencerId === userId);
  }

    async getUpdates(): Promise<Update[]> {
    // Simple: Find rows with date_status_updated and use their status_dashboard
    if (this.useGoogleSheets) {
      try {
        const campaigns = await this.getCampaigns();
        const updates: Update[] = [];
        
        // Find campaigns that have date_status_updated
        const campaignsWithUpdates = campaigns.filter(campaign => {
          return campaign.updatedAt && campaign.updatedAt.toString() !== '';
        });
        
        console.log(`📊 Found ${campaignsWithUpdates.length} campaigns with date_status_updated`);
        
        // Generate updates based on status_dashboard
        campaignsWithUpdates.forEach(campaign => {
          const statusUpdateDate = new Date(campaign.updatedAt);
          let updateMessage = '';
          let updateType: 'submission' | 'status_change' | 'approval' = 'status_change';
          
          // Generate update message based on status_dashboard
          switch (campaign.status) {
            case 'plan_submitted':
              updateMessage = `${campaign.influencerName}さんから構成案が提出されました`;
              updateType = 'submission';
              break;
            case 'plan_reviewing':
              updateMessage = `${campaign.influencerName}さんの構成案を確認中です`;
              updateType = 'approval';
              break;
            case 'plan_revising':
              updateMessage = `${campaign.influencerName}さんの構成案を修正中です`;
              updateType = 'approval';
              break;
            case 'draft_submitted':
              updateMessage = `${campaign.influencerName}さんから初稿が提出されました`;
              updateType = 'submission';
              break;
            case 'draft_reviewing':
              updateMessage = `${campaign.influencerName}さんの初稿を確認中です`;
              updateType = 'approval';
              break;
            case 'draft_revising':
              updateMessage = `${campaign.influencerName}さんの初稿を修正中です`;
              updateType = 'approval';
              break;
            case 'scheduling':
              updateMessage = `${campaign.influencerName}さんのコンテンツ投稿準備中です`;
              updateType = 'status_change';
              break;
            case 'scheduled':
              updateMessage = `${campaign.influencerName}さんのコンテンツが投稿されました！`;
              updateType = 'status_change';
              break;
            case 'completed':
              updateMessage = `${campaign.influencerName}さんのプロモーションが完了しました`;
              updateType = 'status_change';
              break;
            case 'cancelled':
              updateMessage = `${campaign.influencerName}さんのプロモーションがキャンセルされました`;
              updateType = 'status_change';
              break;
            default:
              updateMessage = `${campaign.influencerName}さんのステータスが「${campaign.status}」に更新されました`;
              updateType = 'status_change';
          }
          
          updates.push({
            id: `update_${campaign.id}_${campaign.status}`,
            message: updateMessage,
            timestamp: statusUpdateDate,
            type: updateType,
            campaignId: campaign.id,
            influencerId: campaign.influencerId,
            influencerName: campaign.influencerName,
          });
        });
        
        // Sort by timestamp (newest first) and return latest 10 updates
        const sortedUpdates = updates
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10);
        
        console.log(`✅ Generated ${sortedUpdates.length} updates`);
        return sortedUpdates;
      } catch (error) {
        console.error('Failed to generate updates from Google Sheets:', error);
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
