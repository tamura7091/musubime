import { Campaign, User, Update } from '@/types';
import { googleSheetsService } from './google-sheets';
import { mockCampaigns, mockUsers, mockUpdates } from './mock-data';

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
          currency: 'JPY',
          createdAt: campaign.createdAt,
          updatedAt: campaign.createdAt,
          schedules: {
            meeting: campaign.schedules.meetingDate,
            planSubmission: campaign.schedules.planSubmissionDate,
            draftSubmission: campaign.schedules.draftSubmissionDate,
            publishDate: campaign.schedules.liveDate,
          },
          requirements: campaign.requirements,
          referenceLinks: campaign.referenceLinks.map(link => ({
            title: 'Reference',
            url: link
          })),
          notes: campaign.notes,
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
    const allCampaigns = await this.getCampaigns();
    return allCampaigns.filter(campaign => campaign.influencerId === userId);
  }

  async getUpdates(): Promise<Update[]> {
    // Updates are not typically stored in the Google Sheets for this use case
    // They would be generated based on campaign status changes
    if (this.useGoogleSheets) {
      try {
        const campaigns = await this.getCampaigns();
        const updates: Update[] = [];
        
        // Generate updates based on recent campaign status changes
        campaigns.forEach(campaign => {
          // This is a simplified example - in a real system, you'd track actual status changes
          if (campaign.status === 'live') {
            updates.push({
              id: `update_${campaign.id}_live`,
              message: `${campaign.title}が投稿されました！`,
              timestamp: new Date().toISOString(),
              type: 'campaign_live',
              campaignId: campaign.id,
            });
          } else if (campaign.status === 'completed') {
            updates.push({
              id: `update_${campaign.id}_completed`,
              message: `${campaign.title}のお支払いが完了しました。`,
              timestamp: new Date().toISOString(),
              type: 'payment_completed',
              campaignId: campaign.id,
            });
          }
        });
        
        return updates.slice(0, 10); // Return latest 10 updates
      } catch (error) {
        console.error('Failed to generate updates from Google Sheets, falling back to mock data:', error);
        return mockUpdates;
      }
    }
    
    return mockUpdates;
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
