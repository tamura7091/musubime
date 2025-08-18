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

  async getSheetData(range: string = (process.env.GOOGLE_SHEETS_RANGE || 'campaigns!A:BT')): Promise<GoogleSheetsRow[]> {
    try {
      console.log('🔍 GoogleSheetsService.getSheetData() called');
      console.log('📊 Range:', range);
      console.log('📊 Environment GOOGLE_SHEETS_RANGE:', process.env.GOOGLE_SHEETS_RANGE);
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
      console.log('📊 Total columns fetched:', headers.length);
      console.log('📋 Last 10 headers:', headers.slice(-10)); // Show last 10 headers
      
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

  // Fetch only specific columns by header names
  async getSpecificColumns(columnNames: string[], influencerId?: string): Promise<GoogleSheetsRow[]> {
    try {
      console.log('🔍 GoogleSheetsService.getSpecificColumns() called');
      console.log('📋 Requested columns:', columnNames);
      
      this.assertConfigured();

      const request: any = {
        spreadsheetId: this.spreadsheetId,
        range: 'campaigns!A:BT', // Fetch full range to get all columns
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
      console.log('📊 Total columns in sheet:', headers.length);
      console.log('📋 All headers:', headers);
      
      // Create a map of requested columns to their indices
      const columnMap: { [key: string]: number } = {};
      columnNames.forEach(col => {
        const index = headers.findIndex(header => header === col);
        if (index !== -1) {
          columnMap[col] = index;
          console.log(`✅ Found column "${col}" at index ${index}`);
        } else {
          console.log(`❌ Column "${col}" not found in sheet`);
        }
      });

      console.log('📋 Column mapping:', columnMap);
      
      // Convert rows to objects using only the requested columns
      // Skip first 4 rows (rows 2-5) and start from row 5 (index 4)
      let filteredRows = rows.slice(4);
      
      // Filter by influencer if specified
      if (influencerId) {
        const influencerIdIndex = headers.findIndex(header => header === 'id_influencer');
        if (influencerIdIndex !== -1) {
          filteredRows = filteredRows.filter((row: any) => row[influencerIdIndex] === influencerId);
          console.log(`🔍 Filtered rows for influencer ${influencerId}: ${filteredRows.length} rows`);
        }
      }
      
      const data: GoogleSheetsRow[] = filteredRows.map((row: any) => {
        const rowObj: GoogleSheetsRow = {};
        columnNames.forEach(col => {
          const index = columnMap[col];
          if (index !== undefined) {
            rowObj[col] = row[index] || '';
          } else {
            rowObj[col] = ''; // Default empty value for missing columns
          }
        });
        return rowObj;
      });

      console.log('✅ Specific columns data processed:', data.length, 'rows');
      console.log('📊 Sample data:', data.slice(0, 2));
      return data;
    } catch (error: any) {
      if (error?.code === 'GOOGLE_SHEETS_NOT_CONFIGURED') {
        throw error;
      }
      console.error('Error fetching specific columns:', error?.message || error);
      throw error;
    }
  }

  // Map Google Sheets data to our application data structure
  async getUsers(): Promise<GoogleSheetsUser[]> {
    const data = await this.getSheetData();
    console.log('📊 Raw Google Sheets data (first 3 rows):', data.slice(0, 3));
    console.log('📋 Available column headers:', Object.keys(data[0] || {}));
    
    // Filter out rows with empty id_influencer
    const validData = data.filter(row => {
      const influencerId = row['id_influencer'] || row['influencer_id'];
      const isValid = influencerId && influencerId.trim() !== '';
      if (!isValid) {
        console.log('🚫 Skipping user row with empty id_influencer:', row);
      }
      return isValid;
    });
    
    console.log('📊 Valid users (with id_influencer):', validData.length);
    
    const users = validData.map((row, index) => {
      // Search for ID in all possible column variations
      const possibleIds = [
        row['id_influencer'],
        row['influencer_id'],
        row['id_influencer'],
        row['ID'],
        row['id'],
        row['Influencer ID'],
        row['InfluencerID'],
        row['influencerId']
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
  async getCampaigns(influencerId?: string) {
    console.log('🎯 getCampaigns() called', influencerId ? `for influencer: ${influencerId}` : 'for all influencers');
    const data = await this.getSpecificColumns([
      'spend_jpy', 
      'id_influencer', 
      'id_campaign', 
      'status_dashboard',
      'name',
      'date_plan',
      'date_draft', 
      'date_live',
      'date_deal_closed',
      'date_status_updated'
    ], influencerId);
    
    // Filter out rows with empty id_campaign
    const validData = data.filter(row => {
      const campaignId = row['id_campaign'] || row['campaign_id'];
      
      // Check if campaign ID exists
      const hasCampaignId = campaignId && campaignId.trim() !== '';
      if (!hasCampaignId) {
        console.log('🚫 Skipping row with empty id_campaign:', row);
        return false;
      }
      
      return true;
    });
    
    console.log('📊 Valid campaigns (with id_campaign):', validData.length);
    
          // Debug: Show available columns from first row
      if (validData.length > 0) {
        console.log('🔍 Available columns in sheet:', Object.keys(validData[0]));
        console.log('🔍 Sample row data:', validData[0]);
        
        // Show all columns and their values for the first row
        console.log('🔍 All columns and values for first row:');
        Object.keys(validData[0]).forEach((col, index) => {
          const value = validData[0][col];
          console.log(`  ${index + 1}. "${col}": "${value}" (type: ${typeof value})`);
        });
      
      // Debug: Show all status-related columns
      console.log('🔍 Status-related columns:');
      const statusColumns = Object.keys(validData[0]).filter(key => 
        key.toLowerCase().includes('status') || 
        key.toLowerCase().includes('dashboard') ||
        key.toLowerCase().includes('payout') ||
        key.toLowerCase().includes('utm')
      );
      console.log('📋 Status columns found:', statusColumns);
      
      // Debug: Specifically check for status_dashboard column
      console.log('🔍 Looking for status_dashboard column:');
      const hasStatusDashboard = Object.keys(validData[0]).includes('status_dashboard');
      console.log('📋 Has status_dashboard column:', hasStatusDashboard);
      
      if (hasStatusDashboard) {
        console.log('📊 status_dashboard column values:');
        validData.forEach((row, index) => {
          const value = row['status_dashboard'];
          console.log(`  Row ${index + 1} (${row['id_campaign']}): "${value}" (type: ${typeof value}, length: ${value?.length})`);
        });
        
        // Check for similar column names
        console.log('🔍 Looking for similar column names:');
        const similarColumns = Object.keys(validData[0]).filter(key => 
          key.toLowerCase().includes('dashboard') || 
          key.toLowerCase().includes('status')
        );
        console.log('📋 Similar columns found:', similarColumns);
        
        // More comprehensive search for status-related columns
        console.log('🔍 Comprehensive search for status columns:');
        const allColumns = Object.keys(validData[0]);
        const statusRelatedColumns = allColumns.filter(key => {
          const lowerKey = key.toLowerCase();
          return lowerKey.includes('status') || 
                 lowerKey.includes('dashboard') || 
                 lowerKey.includes('state') ||
                 lowerKey.includes('phase') ||
                 lowerKey.includes('step') ||
                 lowerKey.includes('progress');
        });
        console.log('📋 All status-related columns:', statusRelatedColumns);
        
        // Show exact column names with their positions
        console.log('🔍 All column names with positions:');
        allColumns.forEach((col, index) => {
          console.log(`  ${index + 1}. "${col}" (exact: "${col}")`);
        });
        
        // Show values for similar columns
        similarColumns.forEach(col => {
          console.log(`📊 Values in "${col}" column:`);
          validData.forEach((row, index) => {
            console.log(`  Row ${index + 1} (${row['id_campaign']}): "${row[col]}"`);
          });
        });
      } else {
        console.log('❌ status_dashboard column not found! Available columns:');
        Object.keys(validData[0]).forEach((col, index) => {
          console.log(`  ${index + 1}. "${col}"`);
        });
      }
      
      // Show values for status columns in first few rows
      validData.slice(0, 3).forEach((row, index) => {
        console.log(`📊 Row ${index + 1} status values:`, {
          id: row['id_campaign'],
          statusColumns: statusColumns.reduce((acc, col) => {
            acc[col] = row[col];
            return acc;
          }, {} as any)
        });
      });
      
      // Debug: Show all status_dashboard values
      console.log('📊 All status_dashboard values:');
      validData.forEach((row, index) => {
        if (row['status_dashboard']) {
          console.log(`  Row ${index + 1}: "${row['status_dashboard']}"`);
        }
      });
      
      // Debug: Look for any column containing "scheduling"
      console.log('🔍 Looking for columns containing "scheduling":');
      const schedulingColumns = Object.keys(validData[0]).filter(key => 
        key.toLowerCase().includes('scheduling') || 
        key.toLowerCase().includes('schedule')
      );
      console.log('📋 Scheduling-related columns:', schedulingColumns);
      
      // Show values for scheduling columns
      validData.slice(0, 3).forEach((row, index) => {
        if (schedulingColumns.length > 0) {
          console.log(`📊 Row ${index + 1} scheduling values:`, {
            id: row['id_campaign'],
            schedulingColumns: schedulingColumns.reduce((acc, col) => {
              acc[col] = row[col];
              return acc;
            }, {} as any)
          });
        }
      });
      
      // Debug: Show campaign mapping details
      console.log('📋 Campaign mapping details:');
      validData.slice(0, 3).forEach((row, index) => {
        console.log(`Campaign ${index + 1}:`, {
          id: row['id_campaign'],
          influencerId: row['id_influencer'],
          name: row['name'],
          platform: row['platform'],
          status_dashboard: row['status_dashboard'],
          spend_jpy: row['spend_jpy'],
          followers: row['followers'],
          url_channel: row['url_channel'],
          url_content: row['url_content']
        });
      });
    }
    
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
        // Basic campaign info
        id: row['id_campaign'] || `campaign_${index}`,
        title: row['id_campaign'] || 'Untitled Campaign',
        influencerId: row['id_influencer'] || `user_${index}`,
        influencerName: row['name'] || 'Unknown Influencer',
        
        // Status and platform
        status: (() => {
          // Only use status_dashboard column, no fallbacks
          const rawStatus = row['status_dashboard'];
          console.log(`🔍 Campaign ${row['id_campaign']}: status_dashboard raw value = "${rawStatus}" (type: ${typeof rawStatus})`);
          
          if (!rawStatus || rawStatus === 'undefined' || rawStatus === '' || rawStatus === undefined) {
            console.log(`⚠️ Campaign ${row['id_campaign']}: status_dashboard is empty/undefined, using default`);
            return 'meeting_scheduling'; // Default status
          }
          
          const mappedStatus = this.mapStatus(rawStatus);
          console.log(`📊 Campaign ${row['id_campaign']}: status_dashboard="${rawStatus}", mapped to="${mappedStatus}"`);
          return mappedStatus;
        })(),
        platform: this.mapPlatform(row['platform'] || 'yt'),
        
        // Financial info
        contractedPrice: this.parsePrice(row['spend_jpy'] || '0'),
        currency: 'JPY',
        
        // Dates and schedules
        createdAt: row['date_deal_closed'] || new Date().toISOString(),
        updatedAt: row['date_status_updated'] || new Date().toISOString(),
        schedules: {
          meetingDate: null, // Not in current sheet structure
          planSubmissionDate: row['date_plan'] || null,
          draftSubmissionDate: row['date_draft'] || null,
          liveDate: row['date_live'] || null,
        },
        
        // Campaign details
        requirements: this.parseRequirements(row['template'] || ''),
        referenceLinks: this.parseLinks(row['url_plan'] || ''),
        notes: row['notes'] || row['status_notes'] || '',
        
        // Additional campaign data
        campaignData: {
          id_promo: row['id_promo'],
          contact_email: row['contact_email'],
          url_channel: row['url_channel'],
          url_content: row['url_content'],
          group: row['group'],
          followers: row['followers'],
          spend_usd: row['spend_usd'],
          imp_est: row['imp_est'],
          imp_actual: row['imp_actual'],
          url_plan: row['url_plan'],
          url_draft: row['url_draft'],
          url_utm: row['url_utm'],
          payout_form_link: row['payout_form_link'],
          spend_jpy_taxed: row['spend_jpy_taxed'],
          is_live: row['is_live'],
          genre: row['genre'],
          tier: row['tier'],
          platform_tier: row['platform_tier'],
          roi_positive: row['roi_positive'],
          handle: row['handle'],
          dri: row['dri'],
          repurposable: row['repurposable'],
          group_platform: row['group_platform'],
          channel_image: row['channel_image'],
          utm_campaign: row['utm_campaign'],
          month_date_live: row['month_date_live'],
          yyyy_mm_ww: row['yyyy-mm-ww'],
          payout_done: row['payout_done'],
          group_booking: row['group_booking'],
          mode_id_campaign: row['mode_id_campaign'],
          
          // Form submission status
          gift_sent: row['Gift Sent'],
          contract_form_submitted: row['Contract Form Submitted'],
          plan_submitted: row['Plan Submitted'],
          draft_submitted: row['Draft Submitted'],
          live_video_submitted: row['Live Video Submitted'],
          payout_form_submitted: row['Payout Form Submitted'],
          
          // UTM parameters
          utm_poc: row['utm_poc'],
          utm_platform: row['utm_platform'],
          utm_web_domain: row['utm_web_domain'],
          utm_time_period: row['utm_time_period'],
          utm_url_bitly: row['utm_url_bitly'],
          url_main_form: row['url_main_form'],
          url_payout_form: row['url_payout_form'],
          
          // Additional fields
          output: row['output'],
          is_row_added: row['is_row_added'],
          count_id_influencer: row['count_id_influencer'],
          noted_influencers: row['noted_influencers'],
        }
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
