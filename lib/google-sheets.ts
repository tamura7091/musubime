import { google } from 'googleapis';

// Types for our Google Sheets data structure
export interface GoogleSheetsUser {
  id: string;
  name: string;
  email: string;
  platform: string;
  channelUrl: string;
  status: string;
  statusDashboard: string;
  contractedPrice: string;
  password?: string; // For authentication
}

export interface GoogleSheetsRow {
  [key: string]: string | undefined;
}

class GoogleSheetsService {
  private sheets;
  private spreadsheetId: string;
  private hasServiceAccount: boolean;
  private hasApiKey: boolean;

  constructor() {
    // Detect credentials
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    this.hasServiceAccount = Boolean(clientEmail && privateKey);
    this.hasApiKey = Boolean(process.env.GOOGLE_SHEETS_API_KEY);

    console.log('🔧 GoogleSheetsService constructor called');
    console.log('📧 Service Account Email:', clientEmail);
    console.log('🔑 Has Private Key:', !!privateKey);
    console.log('🔑 Private Key starts with:', privateKey?.substring(0, 50) + '...');
    console.log('🔑 Has API Key:', this.hasApiKey);
    console.log('🔑 API Key starts with:', process.env.GOOGLE_SHEETS_API_KEY?.substring(0, 20) + '...');

    let auth: any = undefined;
    if (this.hasServiceAccount) {
      console.log('🔐 Setting up Service Account authentication');
      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    } else if (this.hasApiKey) {
      console.log('🔑 Setting up API Key authentication');
    } else {
      console.log('❌ No authentication method available');
    }

    this.sheets = google.sheets({ version: 'v4', auth });
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1OCVA_z4FFLGGg8jCRKqla5AMHZLkGMdIpzmizetDPNI';
    console.log('📊 Spreadsheet ID:', this.spreadsheetId);
  }

  private assertConfigured() {
    if (!this.hasServiceAccount && !this.hasApiKey) {
      const err: any = new Error('Google Sheets not configured');
      err.code = 'GOOGLE_SHEETS_NOT_CONFIGURED';
      throw err;
    }
  }

  async getSheetData(range: string = (process.env.GOOGLE_SHEETS_RANGE || 'campaigns')): Promise<GoogleSheetsRow[]> {
    try {
      console.log('🔍 GoogleSheetsService.getSheetData() called');
      console.log('📊 Range:', range);
      console.log('📋 SpreadsheetId:', this.spreadsheetId);
      console.log('🔑 Has Service Account:', this.hasServiceAccount);
      console.log('🔑 Has API Key:', this.hasApiKey);
      
      this.assertConfigured();

      const request: any = {
        spreadsheetId: this.spreadsheetId,
        range,
      };
      // If using API key instead of service account
      if (this.hasApiKey && !this.hasServiceAccount) {
        request.key = process.env.GOOGLE_SHEETS_API_KEY;
        console.log('🔑 Using API Key authentication');
      } else if (this.hasServiceAccount) {
        console.log('🔑 Using Service Account authentication');
      }

      console.log('📡 Making request to Google Sheets API...');
      const response = await this.sheets.spreadsheets.values.get(request);
      console.log('✅ Google Sheets API response received');
      console.log('📈 Rows returned:', response.data.values?.length || 0);

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return [];
      }

      // First row contains headers
      const headers = rows[0] as string[];
      console.log('📋 Headers found:', headers.slice(0, 10)); // Show first 10 headers
      
      // Convert rows to objects using headers as keys
      // Skip first 4 rows (rows 2-5) and start from row 5 (index 4)
      const data: GoogleSheetsRow[] = rows.slice(4).map(row => {
        const rowObj: GoogleSheetsRow = {};
        headers.forEach((header, index) => {
          rowObj[header] = row[index] || '';
        });
        return rowObj;
      });

      console.log('✅ Data processed:', data.length, 'rows');
      return data;
    } catch (error: any) {
      if (error?.code === 'GOOGLE_SHEETS_NOT_CONFIGURED') {
        throw error;
      }
      console.error('Error fetching Google Sheets data:', error?.message || error);
      throw error;
    }
  }

  // Map Google Sheets data to our application data structure
  async getUsers(): Promise<GoogleSheetsUser[]> {
    const data = await this.getSheetData();
    console.log('📊 Raw Google Sheets data (first 3 rows):', data.slice(0, 3));
    console.log('📋 Available column headers:', Object.keys(data[0] || {}));
    
    // Filter out rows with empty id_campaign
    const validData = data.filter(row => {
      const campaignId = row['id_campaign'] || row['campaign_id'];
      const isValid = campaignId && campaignId.trim() !== '';
      if (!isValid) {
        console.log('🚫 Skipping user row with empty id_campaign:', row);
      }
      return isValid;
    });
    
    console.log('📊 Valid users (with id_campaign):', validData.length);
    
    const users = validData.map((row, index) => {
      // Search for ID in all possible column variations
      const possibleIds = [
        row['id_campaign'],
        row['campaign_id'],
        row['campaign id'],
        row['ID'],
        row['id'],
        row['Campaign ID'],
        row['CampaignID'],
        row['campaignId']
      ].filter(Boolean);
      
      // Search for password in all possible column variations
      const possiblePasswords = [
        row['password_dashboard'],
        row['dashboard_password'],
        row['password'],
        row['Password'],
        row['パスワード'],
        row['dashboard password'],
        row['dashboard-password']
      ].filter(Boolean);
      
      // Search for name in all possible column variations
      const possibleNames = [
        row['インフルエンサー名'],
        row['name'],
        row['Name'],
        row['influencer_name'],
        row['influencer name'],
        row['Influencer Name']
      ].filter(Boolean);
      
      const user = {
        id: possibleIds[0] || `user_${index}`,
        name: possibleNames[0] || 'Unknown',
        email: row['email'] || row['Email'] || '',
        platform: this.mapPlatform(row['platform'] || row['プラットフォーム'] || 'yt'),
        channelUrl: row['channel_url'] || row['チャンネルURL'] || row['Channel URL'] || '',
        status: row['status'] || row['ステータス'] || 'pending',
        statusDashboard: row['status_dashboard'] || row['status'] || row['ステータス'] || 'pending',
        contractedPrice: row['contracted_price'] || row['報酬'] || '0',
        password: possiblePasswords[0] || '', // For authentication
      };
      
      if (index < 3) {
        console.log(`👤 User ${index + 1}:`, {
          id: user.id,
          name: user.name,
          hasPassword: !!user.password,
          passwordLength: user.password?.length || 0,
          possibleIds,
          possiblePasswords: possiblePasswords.map(p => p ? '***' : ''),
          possibleNames
        });
      }
      
      return user;
    });
    
    console.log('📊 Total users processed:', users.length);
    console.log('🔑 Users with passwords:', users.filter(u => u.password).length);
    
    return users;
  }

  // Get campaigns from the sheet data
  async getCampaigns() {
    console.log('🎯 getCampaigns() called');
    const data = await this.getSheetData();
    
    // Filter out rows with empty id_campaign
    const validData = data.filter(row => {
      const campaignId = row['id_campaign'] || row['campaign_id'];
      const isValid = campaignId && campaignId.trim() !== '';
      if (!isValid) {
        console.log('🚫 Skipping row with empty id_campaign:', row);
      }
      return isValid;
    });
    
    console.log('📊 Valid campaigns (with id_campaign):', validData.length);
    
    return validData.map((row, index) => {
      // Debug date values from Google Sheets
      console.log('📅 Campaign dates from Google Sheets:', {
        id: row['id_campaign'],
        date_plan: row['date_plan'],
        date_draft: row['date_draft'],
        date_live: row['date_live'],
        influencerName: row['インフルエンサー名'] || row['influencer_name'] || row['name']
      });
      
      // More visible debugging
      if (row['date_plan'] || row['date_draft'] || row['date_live']) {
        console.log('🔍 FOUND DATES!', {
          id: row['id_campaign'],
          plan: row['date_plan'],
          draft: row['date_draft'],
          live: row['date_live']
        });
      }
      
      return {
        id: row['id_campaign'] || row['campaign_id'] || `campaign_${index}`,
        title: row['id_campaign'] || row['キャンペーン名'] || row['title'] || 'Untitled Campaign',
        influencerId: row['influencer_id'] || row['id_campaign'] || `user_${index}`,
        influencerName: row['インフルエンサー名'] || row['influencer_name'] || row['name'] || 'Unknown Influencer',
        status: (() => {
          const statusValue = row['status_dashboard'] || row['status_campaigns'] || row['status'] || 'pending';
          console.log(`📊 Campaign ${row['id_campaign']}: status_dashboard="${row['status_dashboard']}", mapped to="${statusValue}"`);
          return statusValue;
        })(),
        platform: row['platform'] || 'yt',
        contractedPrice: this.parsePrice(row['spend_jpy'] || row['contracted_price'] || row['報酬'] || '0'),
        createdAt: row['created_at'] || new Date().toISOString(),
        schedules: {
          meetingDate: row['meeting_date'] || row['打ち合わせ'] || null,
          planSubmissionDate: row['date_plan'] || row['plan_submission_date'] || row['構成案提出'] || null,
          draftSubmissionDate: row['date_draft'] || row['draft_submission_date'] || row['初稿提出'] || null,
          liveDate: row['date_live'] || row['live_date'] || row['投稿日'] || null,
        },
        requirements: this.parseRequirements(row['requirements'] || ''),
        referenceLinks: this.parseLinks(row['reference_links'] || ''),
        notes: row['notes'] || '',
      };
    });
  }

  // Map platform values from Google Sheets to our enum
  private mapPlatform(platform: string): string {
    const platformMap: { [key: string]: string } = {
      'yt': 'youtube_long',
      'youtube': 'youtube_long',
      'youtube_long': 'youtube_long',
      'youtube_short': 'youtube_short',
      'short': 'youtube_short',
      'ig': 'instagram_reel',
      'instagram': 'instagram_reel',
      'tiktok': 'tiktok',
      'x': 'x_twitter',
      'twitter': 'x_twitter',
      'podcast': 'podcast',
      'blog': 'blog',
    };
    
    return platformMap[platform.toLowerCase()] || 'youtube_long';
  }

  // Map status values from Google Sheets to our enum
  private mapStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      // Legacy status mappings
      'contract prep': 'contract_pending',
      'contract_pending': 'contract_pending',
      'plan_submission': 'plan_creating',
      'plan_review': 'plan_reviewing',
      'content_creation': 'draft_creating',
      'draft_review': 'draft_reviewing',
      'ready_to_publish': 'scheduling',
      'live': 'scheduled',
      'PAYOUT_DONE': 'completed',
      'payout_done': 'completed',
      'FORM_PENDING': 'contract_pending',
      
      // New status_dashboard mappings (direct mapping)
      'meeting_scheduling': 'meeting_scheduling',
      'meeting_scheduled': 'meeting_scheduled',
      'plan_creating': 'plan_creating',
      'plan_submitted': 'plan_submitted',
      'plan_reviewing': 'plan_reviewing',
      'plan_revising': 'plan_revising',
      'draft_creating': 'draft_creating',
      'draft_submitted': 'draft_submitted',
      'draft_reviewing': 'draft_reviewing',
      'draft_revising': 'draft_revising',
      'scheduling': 'scheduling',
      'scheduled': 'scheduled',
      'payment_processing': 'payment_processing',
      'completed': 'completed',
      'cancelled': 'cancelled',
    };
    
    const mappedStatus = statusMap[status.toLowerCase()] || 'meeting_scheduling';
    console.log(`🔄 Status mapping: "${status}" -> "${mappedStatus}"`);
    return mappedStatus;
  }

  // Parse requirements string into array
  private parseRequirements(requirements: string): string[] {
    if (!requirements) return [];
    return requirements.split('\n').filter(req => req.trim().length > 0);
  }

  // Parse links string into array
  private parseLinks(links: string): string[] {
    if (!links) return [];
    return links.split('\n').filter(link => link.trim().length > 0);
  }

  // Parse price string to number, handling currency symbols and formatting
  private parsePrice(priceString: string): number {
    if (!priceString) return 0;
    
    // Remove currency symbols and common formatting
    const cleaned = priceString
      .replace(/[¥$€£,]/g, '') // Remove currency symbols and commas
      .replace(/\s/g, '') // Remove whitespace
      .trim();
    
    console.log('💰 Parsing price:', { original: priceString, cleaned });
    
    // More visible debugging for prices
    if (priceString && priceString !== '0') {
      console.log('🔍 FOUND PRICE!', { original: priceString, cleaned, parsed: parseInt(cleaned, 10) });
    }
    
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Parse date string to ISO string, handling various date formats
  private parseDate(dateString: string): string | null {
    if (!dateString || dateString.trim() === '') return null;
    
    console.log('📅 Parsing date:', { original: dateString });
    
    try {
      // Handle yyyy-mm-dd format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        // Create date in local timezone to avoid UTC conversion issues
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day); // month is 0-indexed
        console.log('📅 Parsed yyyy-mm-dd:', { input: dateString, output: date.toISOString(), localDate: date });
        return date.toISOString();
      }
      
      // Handle other date formats
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.log('📅 Invalid date format:', dateString);
        return null;
      }
      
      console.log('📅 Parsed date:', { input: dateString, output: date.toISOString() });
      return date.toISOString();
    } catch (error) {
      console.log('📅 Date parsing error:', { input: dateString, error });
      return null;
    }
  }

  // Authenticate user with ID and password from Google Sheets
  async authenticateUser(id: string, password: string): Promise<GoogleSheetsUser | null> {
    try {
      console.log('🔐 GoogleSheetsService.authenticateUser() called');
      console.log('🔍 Looking for user with ID:', id);
      console.log('🔑 Checking password:', password);
      
      const users = await this.getUsers();
      console.log('📊 Total users loaded from Google Sheets:', users.length);
      console.log('👥 Available user IDs:', users.map(u => ({ id: u.id, name: u.name, hasPassword: !!u.password })));
      
      // Search for user by ID in the entire row content
      const user = users.find(u => {
        const idMatch = u.id === id;
        const passwordMatch = u.password === password;
        console.log(`🔍 Checking user ${u.id}:`, { idMatch, passwordMatch, userPassword: u.password });
        return idMatch && passwordMatch;
      });
      
      console.log('🔍 User search result:', user ? 'Found' : 'Not found');
      
      if (user) {
        console.log('✅ User authenticated successfully');
        console.log('👤 User details:', { id: user.id, name: user.name, email: user.email });
        // Remove password from returned user object for security
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword as GoogleSheetsUser;
      } else {
        console.log('❌ User not found or password mismatch');
        console.log('🔍 Checking if user exists with different password...');
        const userExists = users.find(u => u.id === id);
        if (userExists) {
          console.log('⚠️ User exists but password is different');
          console.log('🔑 Expected password:', userExists.password);
          console.log('🔑 Provided password:', password);
        } else {
          console.log('⚠️ User with this ID does not exist');
          // Search through all row values for the ID
          console.log('🔍 Searching through all row values for ID:', id);
          const rawData = await this.getSheetData();
          const matchingRows = rawData.filter((row, index) => {
            const rowValues = Object.values(row).join(' ').toLowerCase();
            const searchId = id.toLowerCase();
            const found = rowValues.includes(searchId);
            if (found) {
              console.log(`📋 Found ID in row ${index + 1}:`, row);
            }
            return found;
          });
          console.log('📊 Rows containing the ID:', matchingRows.length);
        }
      }
      
      return null;
    } catch (error: any) {
      if (error?.code === 'GOOGLE_SHEETS_NOT_CONFIGURED') {
        throw error; // Let API layer decide how to handle
      }
      console.error('Authentication error:', error?.message || error);
      return null;
    }
  }
}

// Export singleton instance
export const googleSheetsService = new GoogleSheetsService();
