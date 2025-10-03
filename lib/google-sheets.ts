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
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheTtlMs: number;
  private debugSheets: boolean;

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
    console.log('🔍 Environment variables check:', {
      GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Set' : 'Not set',
      GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY ? 'Set' : 'Not set',
      GOOGLE_SHEETS_API_KEY: process.env.GOOGLE_SHEETS_API_KEY ? 'Set' : 'Not set',
      GOOGLE_SHEETS_SPREADSHEET_ID: process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? 'Set' : 'Not set'
    });

    let auth: any = undefined;
    if (this.hasServiceAccount) {
      console.log('🔐 Setting up Service Account authentication');
      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } else if (this.hasApiKey) {
      console.log('🔑 Setting up API Key authentication');
    } else {
      console.log('❌ No authentication method available');
    }

    this.sheets = google.sheets({ version: 'v4', auth });
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1OCVA_z4FFLGGg8jCRKqla5AMHZLkGMdIpzmizetDPNI';
    this.cache = new Map();
    this.cacheTtlMs = Number(process.env.GOOGLE_SHEETS_CACHE_TTL_MS || 30000);
    this.debugSheets = process.env.DEBUG_SHEETS === '1';
    console.log('📊 Spreadsheet ID:', this.spreadsheetId);
    console.log('🧠 Sheets cache TTL (ms):', this.cacheTtlMs);
  }

  private getCache(key: string) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.cacheTtlMs) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setCache(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private invalidateCacheByPrefixes(prefixes: string[]) {
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (prefixes.some((p) => key.includes(p))) {
        this.cache.delete(key);
      }
    }
  }

  private assertConfigured() {
    if (!this.hasServiceAccount && !this.hasApiKey) {
      const err: any = new Error('Google Sheets not configured');
      err.code = 'GOOGLE_SHEETS_NOT_CONFIGURED';
      throw err;
    }
  }

  async getSheetData(
    range: string = (process.env.GOOGLE_SHEETS_RANGE || 'campaigns!A:ZZ'),
    options?: { forceRefresh?: boolean }
  ): Promise<GoogleSheetsRow[]> {
    try {
      if (this.debugSheets) {
        console.log('🔍 GoogleSheetsService.getSheetData() called');
        console.log('📊 Range:', range);
        console.log('📊 Environment GOOGLE_SHEETS_RANGE:', process.env.GOOGLE_SHEETS_RANGE);
        console.log('📋 SpreadsheetId:', this.spreadsheetId);
        console.log('🔑 Has Service Account:', this.hasServiceAccount);
        console.log('🔑 Has API Key:', this.hasApiKey);
      }
      
      this.assertConfigured();

      const cacheKey = `${this.spreadsheetId}:${range}`;
      const useCache = !options?.forceRefresh;
      if (useCache) {
        const cached = this.getCache(cacheKey);
        if (cached) {
          if (this.debugSheets) console.log('📦 Cache hit for', range);
          return cached;
        }
      }

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
      if (this.debugSheets) {
        console.log('✅ Google Sheets API response received');
        console.log('📈 Rows returned:', response.data.values?.length || 0);
      }

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return [];
      }

      // First row contains headers
      const headers = rows[0] as string[];
      if (this.debugSheets) {
        console.log('📋 Headers found:', headers.slice(0, 10));
        console.log('📊 Total columns fetched:', headers.length);
        console.log('📋 Last 10 headers:', headers.slice(-10));
      }
      
      // Check if message_dashboard column exists
      const messageDashboardIndex = headers.findIndex(h => h === 'message_dashboard');
      if (this.debugSheets) {
        console.log(`📝 message_dashboard column found at index: ${messageDashboardIndex}`);
        if (messageDashboardIndex !== -1) {
          console.log(`📝 message_dashboard is at column ${this.columnIndexToLetter(messageDashboardIndex)}`);
        }
      }
      
      // Convert rows to objects using headers as keys
      // Skip first 4 rows (rows 2-5) and start from row 5 (index 4)
      const data: GoogleSheetsRow[] = rows.slice(4).map(row => {
        const rowObj: GoogleSheetsRow = {};
        headers.forEach((header, index) => {
          rowObj[header] = row[index] || '';
        });
        return rowObj;
      });

      if (useCache) this.setCache(cacheKey, data);
      if (this.debugSheets) console.log('✅ Data processed:', data.length, 'rows');
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
  async getSpecificColumns(
    columnNames: string[],
    influencerId?: string,
    sheetName: string = 'campaigns',
    options?: { forceRefresh?: boolean }
  ): Promise<GoogleSheetsRow[]> {
    try {
      if (this.debugSheets) {
        console.log('🔍 GoogleSheetsService.getSpecificColumns() called');
        console.log('📋 Requested columns:', columnNames);
        console.log('📊 Sheet name:', sheetName);
      }
      
      this.assertConfigured();

      const range = `${sheetName}!A:ZZ`;
      const cacheKey = `${this.spreadsheetId}:${range}`;
      const useCache = !options?.forceRefresh;
      if (useCache) {
        const cached = this.getCache(cacheKey);
        if (cached) {
          if (this.debugSheets) console.log('📦 Cache hit for', range);
          // cached is already an array of normalized row objects
          let cachedRows: any[] = cached.slice(0);
          if (influencerId) {
            cachedRows = cachedRows.filter((row: any) => row['id_influencer'] === influencerId);
          }
          const data: GoogleSheetsRow[] = cachedRows.map((row: any) => {
            const obj: GoogleSheetsRow = {};
            columnNames.forEach(col => { obj[col] = row[col] || ''; });
            return obj;
          });
          return data;
        }
      }

      const request: any = {
        spreadsheetId: this.spreadsheetId,
        range, // Use dynamic sheet name
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
      if (this.debugSheets) {
        console.log('✅ Google Sheets API response received');
        console.log('📈 Rows returned:', response.data.values?.length || 0);
      }

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return [];
      }

      // First row contains headers
      const headers = rows[0] as string[];
      if (this.debugSheets) {
        console.log('📊 Total columns in sheet:', headers.length);
        console.log('📋 All headers:', headers);
      }
      
      // Check if message_dashboard column exists
      const messageDashboardIndex = headers.findIndex(h => h === 'message_dashboard');
      if (this.debugSheets) console.log(`📝 message_dashboard column found at index: ${messageDashboardIndex}`);
      
      // Create a map of requested columns to their indices
      const columnMap: { [key: string]: number } = {};
      columnNames.forEach(col => {
        const index = headers.findIndex(header => header === col);
        if (index !== -1) {
          columnMap[col] = index;
          if (this.debugSheets) console.log(`✅ Found column "${col}" at index ${index}`);
        } else {
          if (this.debugSheets) console.log(`❌ Column "${col}" not found in sheet`);
        }
      });

      if (this.debugSheets) console.log('📋 Column mapping:', columnMap);
      
      // Convert rows to objects using only the requested columns
      // Start index may vary by sheet; many sheets have 4 header rows, but 'selected' starts earlier
      const startIndex = sheetName === 'selected' ? 1 : 4; // include from row 2 for 'selected', row 5 for others
      let filteredRows = rows.slice(startIndex);
      
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

      if (useCache) {
        // Build and cache a normalized object array for the full row based on headers
        const normalizedObjects = rows.slice(startIndex).map((row: any) => {
          const obj: GoogleSheetsRow = {};
          headers.forEach((h, i) => { obj[h] = row[i] || ''; });
          return obj;
        });
        this.setCache(cacheKey, normalizedObjects);
      }

      if (this.debugSheets) {
        console.log('✅ Specific columns data processed:', data.length, 'rows');
        console.log('📊 Sample data:', data.slice(0, 2));
      }
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
        status: row['status'] || row['ステータス'] || 'not_started',
        statusDashboard: row['status_dashboard'] || row['status'] || row['ステータス'] || 'not_started',
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
  async getCampaigns(influencerId?: string, options?: { forceRefresh?: boolean }) {
    console.log('🎯 getCampaigns() called', influencerId ? `for influencer: ${influencerId}` : 'for all influencers');
    const data = await this.getSpecificColumns([
      'spend_jpy', 
      'id_influencer', 
      'id_campaign', 
      'status_dashboard',
      'name',
      'platform',
      'date_plan',
      'date_draft', 
      'date_live',
      'date_deal_closed',
      'date_status_updated',
      // Include feedback JSON so dashboards can show revision requests
      'message_dashboard',
      // URLs needed for dashboard submission links
      'url_plan',
      'url_draft',
      'url_content',
      // Trial login credentials for premium account section
      'trial_login_email_dashboard',
      'trial_login_password_dashboard',
      // Influencer-facing notes (markdown) shown on dashboard
      'note_dashboard'
    ], influencerId, 'campaigns', options);
    
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
          platform: this.mapPlatform(row['platform'] || 'yt'),
          status_dashboard: row['status_dashboard'],
          spend_jpy: row['spend_jpy'],
          followers: row['followers'],
          url_channel: row['url_channel'],
          url_content: row['url_content']
        });
      });
      
      // Debug: Show all platform values
      console.log('📊 All platform values from Google Sheets:');
      const platformValues = validData.map(row => row['platform']).filter((val): val is string => Boolean(val));
      const uniquePlatforms = Array.from(new Set(platformValues));
      console.log('📋 Unique platform values:', uniquePlatforms);
      console.log('📊 Platform value counts:', platformValues.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {} as any));
    }
    
    return validData.map((row, index) => {
              // Debug date_status_updated values from Google Sheets
        if (row['date_status_updated']) {
          console.log('📅 date_status_updated found:', {
            id: row['id_campaign'],
            date_status_updated: row['date_status_updated'],
            status_dashboard: row['status_dashboard'],
            influencerName: row['インフルエンサー名'] || row['influencer_name'] || row['name']
          });
        }
      
      return {
        // Basic campaign info
        id: row['id_campaign'] || `campaign_${index}`,
        title: row['id_campaign'] || 'Untitled Campaign',
        influencerId: row['id_influencer'] || `user_${index}`,
        influencerName: row['name'] || 'Unknown Influencer',
        // Preserve raw status_dashboard for admin metrics
        statusDashboard: row['status_dashboard'] || '',
        
        // Status and platform
        status: (() => {
          // Only use status_dashboard column; treat empty as not_started
          const rawStatus = row['status_dashboard'];
          console.log(`🔍 Campaign ${row['id_campaign']}: status_dashboard raw value = "${rawStatus}" (type: ${typeof rawStatus})`);
          
          if (!rawStatus || rawStatus === 'undefined' || rawStatus === '' || rawStatus === undefined) {
            console.log(`⚠️ Campaign ${row['id_campaign']}: status_dashboard is empty/undefined, using default not_started`);
            return 'not_started';
          }
          
          const mappedStatus = this.mapStatus(rawStatus);
          console.log(`📊 Campaign ${row['id_campaign']}: status_dashboard="${rawStatus}", mapped to="${mappedStatus}"`);
          return mappedStatus;
        })(),
        platform: (() => {
          const rawPlatform = row['platform'];
          console.log(`🔍 Campaign ${row['id_campaign']}: platform raw value = "${rawPlatform}" (type: ${typeof rawPlatform})`);
          const mappedPlatform = this.mapPlatform(rawPlatform || 'yt');
          console.log(`📊 Campaign ${row['id_campaign']}: platform="${rawPlatform}", mapped to="${mappedPlatform}"`);
          return mappedPlatform;
        })(),
        
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
          date_status_updated: row['date_status_updated'],
          message_dashboard: (() => {
            const msgDashboard = row['message_dashboard'];
            console.log(`📝 Campaign ${row['id_campaign']}: message_dashboard = "${msgDashboard}" (type: ${typeof msgDashboard})`);
            return msgDashboard;
          })(),
          // Notes for influencer dashboard (markdown)
          note_dashboard: row['note_dashboard'],
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
          // Trial login credentials
          trial_login_email_dashboard: row['trial_login_email_dashboard'],
          trial_login_password_dashboard: row['trial_login_password_dashboard'],
        }
      };
    });
  }

  // Map platform values from Google Sheets to our enum
  private mapPlatform(platform: string): string {
    console.log(`🔍 Mapping platform: "${platform}" (type: ${typeof platform})`);

    const platformMap: { [key: string]: string } = {
      // YouTube platforms
      'yt': 'yt',
      'youtube': 'yt',
      'youtube_long': 'yt',
      'yts': 'yts',
      'youtube_short': 'yts',
      'youtube_shorts': 'yts',

      // Social media platforms
      'tw': 'tw',
      'twitter': 'tw',
      'x': 'tw',
      'x_twitter': 'tw',

      'ig': 'ig',
      'instagram': 'ig',

      'tt': 'tt',
      'tiktok': 'tt',

      // Short video platforms
      'igr': 'igr',
      'instagram_reel': 'igr',
      'instagram_reels': 'igr',

      'sv': 'sv',
      'short_video': 'sv',
      'short_videos': 'sv',

      // Audio platforms
      'pc': 'pc',
      'podcast': 'pc',
      'podcasts': 'pc',

      'vc': 'vc',
      'voicy': 'vc',

      // Content platforms
      'bl': 'bl',
      'blog': 'bl',
    };

    const mappedPlatform = platformMap[platform.toLowerCase()] || 'yt';
    console.log(`📊 Platform mapping: "${platform}" -> "${mappedPlatform}"`);
    return mappedPlatform;
  }

  // Map status values from Google Sheets to our enum
  public mapStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      // Legacy status mappings
      'contract prep': 'contract_pending',
      'contract_pending': 'contract_pending',
      'plan_submission': 'plan_creating',
      'plan_review': 'plan_submitted',
      'content_creation': 'draft_creating',
      'draft_review': 'draft_submitted',
      'ready_to_publish': 'scheduling',
      'live': 'scheduled',
      'PAYOUT_DONE': 'completed',
      'payout_done': 'completed',
      'FORM_PENDING': 'contract_pending',
      'trial': 'trial',
      
      // New status_dashboard mappings (direct mapping)
      'not_started': 'not_started',
      'meeting_scheduling': 'meeting_scheduling',
      'meeting_scheduled': 'meeting_scheduled',
      'plan_creating': 'plan_creating',
      'plan_submitted': 'plan_submitted',
      'plan_revising': 'plan_revising',
      'draft_creating': 'draft_creating',
      'draft_submitted': 'draft_submitted',
      'draft_revising': 'draft_revising',
      'scheduling': 'scheduling',
      'scheduled': 'scheduled',
      'payment_processing': 'payment_processing',
      'completed': 'completed',
      'cancelled': 'cancelled',
    };
    
    const mappedStatus = statusMap[status.toLowerCase()] || 'not_started';
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

  // Convert column index to Google Sheets column letter (A, B, C, ..., Z, AA, AB, ...)
  private columnIndexToLetter(columnIndex: number): string {
    let result = '';
    while (columnIndex >= 0) {
      result = String.fromCharCode(65 + (columnIndex % 26)) + result;
      columnIndex = Math.floor(columnIndex / 26) - 1;
    }
    return result;
  }

  // Update campaign status in Google Sheets
  async updateCampaignStatus(
    campaignId: string,
    influencerId: string,
    newStatus: string,
    submittedUrl?: string,
    urlType?: 'plan' | 'draft' | 'content',
    messageData?: { type: string; content: string; timestamp: string }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 GoogleSheetsService.updateCampaignStatus() called');
      console.log('📊 Update details:', { campaignId, influencerId, newStatus, submittedUrl, urlType });
      
      // Check if we have write permissions (Service Account required)
      if (!this.hasServiceAccount) {
        console.log('⚠️ No Service Account configured - cannot write to Google Sheets');
        console.log('🔍 Service Account check:', {
          hasServiceAccount: this.hasServiceAccount,
          clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Set' : 'Not set',
          privateKey: process.env.GOOGLE_PRIVATE_KEY ? 'Set' : 'Not set'
        });
        return { 
          success: false, 
          error: 'Google Sheets write access requires Service Account credentials. Please configure GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY environment variables.' 
        };
      }
      
      console.log('✅ Service Account credentials detected, proceeding with update...');
      
      this.assertConfigured();

      // First, find the row with the matching campaign ID
      const request: any = {
        spreadsheetId: this.spreadsheetId,
        range: 'campaigns!A:ZZ', // Fetch full range to find the row
      };
      
      if (this.hasApiKey && !this.hasServiceAccount) {
        request.key = process.env.GOOGLE_SHEETS_API_KEY;
      }

      const response = await this.sheets.spreadsheets.values.get(request);
      const rows = response.data.values;
      
      if (!rows || rows.length === 0) {
        return { success: false, error: 'No data found in sheet' };
      }

      const headers = rows[0] as string[];
      
      // Find the row index for the campaign
      let campaignRowIndex = -1;
      const idCampaignIndex = headers.findIndex(header => header === 'id_campaign');
      
      if (idCampaignIndex === -1) {
        return { success: false, error: 'id_campaign column not found' };
      }

      // Skip first 4 rows (rows 2-5) and start from row 5 (index 4)
      for (let i = 4; i < rows.length; i++) {
        if (rows[i][idCampaignIndex] === campaignId) {
          campaignRowIndex = i;
          break;
        }
      }

      if (campaignRowIndex === -1) {
        return { success: false, error: `Campaign with ID ${campaignId} not found` };
      }

      console.log(`📋 Found campaign at row ${campaignRowIndex + 1}`);

      // Prepare the update data
      const updates: { range: string; values: any[][] }[] = [];
      const currentDateTime = new Date().toISOString(); // Full ISO timestamp with date and time
      const currentDate = currentDateTime.split('T')[0]; // YYYY-MM-DD format for date-only fields

      // Update status_dashboard
      const statusDashboardIndex = headers.findIndex(header => header === 'status_dashboard');
      if (statusDashboardIndex !== -1) {
        const statusRange = `campaigns!${this.columnIndexToLetter(statusDashboardIndex)}${campaignRowIndex + 1}`;
        updates.push({
          range: statusRange,
          values: [[newStatus]]
        });
        console.log(`📊 Updating status_dashboard at ${statusRange} to "${newStatus}"`);
      }

      // Update date_status_updated with full timestamp (date + time)
      const dateStatusUpdatedIndex = headers.findIndex(header => header === 'date_status_updated');
      if (dateStatusUpdatedIndex !== -1) {
        const dateRange = `campaigns!${this.columnIndexToLetter(dateStatusUpdatedIndex)}${campaignRowIndex + 1}`;
        updates.push({
          range: dateRange,
          values: [[currentDateTime]] // Use full timestamp instead of just date
        });
        console.log(`📅 Updating date_status_updated at ${dateRange} to "${currentDateTime}"`);
      }

      // Update message_dashboard with JSON data if provided
      if (messageData) {
        const messageDashboardIndex = headers.findIndex(header => header === 'message_dashboard');
        if (messageDashboardIndex !== -1) {
          // Get existing message_dashboard content
          const existingContent = rows[campaignRowIndex][messageDashboardIndex] || '';
          let messagesArray: any[] = [];
          
          // Parse existing JSON if it exists
          if (existingContent && existingContent.trim()) {
            try {
              messagesArray = JSON.parse(existingContent);
              if (!Array.isArray(messagesArray)) {
                messagesArray = [];
              }
            } catch (parseError) {
              console.log('⚠️ Failed to parse existing message_dashboard JSON, starting fresh');
              messagesArray = [];
            }
          }
          
          // Add new message
          messagesArray.push(messageData);
          
          // Convert back to JSON string
          const updatedJson = JSON.stringify(messagesArray);
          
          const messageRange = `campaigns!${this.columnIndexToLetter(messageDashboardIndex)}${campaignRowIndex + 1}`;
          updates.push({
            range: messageRange,
            values: [[updatedJson]]
          });
          console.log(`💬 Updating message_dashboard at ${messageRange} with new message:`, messageData);
        }
      }

      // Update URL fields based on type
      if (submittedUrl && urlType) {
        let urlColumnIndex = -1;
        
        switch (urlType) {
          case 'plan':
            urlColumnIndex = headers.findIndex(header => header === 'url_plan');
            break;
          case 'draft':
            urlColumnIndex = headers.findIndex(header => header === 'url_draft');
            break;
          case 'content':
            urlColumnIndex = headers.findIndex(header => header === 'url_content');
            break;
        }

        if (urlColumnIndex !== -1) {
          const urlRange = `campaigns!${this.columnIndexToLetter(urlColumnIndex)}${campaignRowIndex + 1}`;
          updates.push({
            range: urlRange,
            values: [[submittedUrl]]
          });
          console.log(`🔗 Updating ${urlType} URL at ${urlRange} to "${submittedUrl}"`);
        }
      }

      // Update date fields based on status
      if (newStatus === 'plan_submitted') {
        const datePlanIndex = headers.findIndex(header => header === 'date_plan');
        if (datePlanIndex !== -1) {
          const dateRange = `campaigns!${this.columnIndexToLetter(datePlanIndex)}${campaignRowIndex + 1}`;
          updates.push({
            range: dateRange,
            values: [[currentDate]]
          });
          console.log(`📅 Updating date_plan at ${dateRange} to "${currentDate}"`);
        }
      }

      if (newStatus === 'draft_submitted') {
        const dateDraftIndex = headers.findIndex(header => header === 'date_draft');
        if (dateDraftIndex !== -1) {
          const dateRange = `campaigns!${this.columnIndexToLetter(dateDraftIndex)}${campaignRowIndex + 1}`;
          updates.push({
            range: dateRange,
            values: [[currentDate]]
          });
          console.log(`📅 Updating date_draft at ${dateRange} to "${currentDate}"`);
        }
      }

      if (newStatus === 'scheduled') {
        const dateLiveIndex = headers.findIndex(header => header === 'date_live');
        if (dateLiveIndex !== -1) {
          const dateRange = `campaigns!${this.columnIndexToLetter(dateLiveIndex)}${campaignRowIndex + 1}`;
          updates.push({
            range: dateRange,
            values: [[currentDate]]
          });
          console.log(`📅 Updating date_live at ${dateRange} to "${currentDate}"`);
        }
      }

      // Execute the updates
      if (updates.length > 0) {
        const batchUpdateRequest = {
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            valueInputOption: 'RAW',
            data: updates
          }
        };

        console.log('📡 Executing batch update with', updates.length, 'updates');
        console.log('📊 Batch update request:', JSON.stringify(batchUpdateRequest, null, 2));
        
        try {
          await this.sheets.spreadsheets.values.batchUpdate(batchUpdateRequest);
          console.log('✅ Batch update completed successfully');
          // Invalidate campaigns-related caches to ensure latest data is visible
          this.invalidateCacheByPrefixes(['campaigns!']);
        } catch (updateError: any) {
          console.error('❌ Batch update failed:', updateError?.message || updateError);
          console.error('❌ Error details:', {
            code: updateError?.code,
            status: updateError?.status,
            message: updateError?.message,
            errors: updateError?.errors
          });
          throw updateError;
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Error updating campaign status:', error?.message || error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  // Update campaign onboarding data
  async updateCampaignOnboarding(
    campaignId: string,
    updateData: Record<string, string>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📝 GoogleSheetsService.updateCampaignOnboarding() called');
      console.log('🎯 Campaign ID:', campaignId);
      console.log('📊 Update data:', updateData);

      // Ensure write access is possible
      if (!this.hasServiceAccount) {
        console.log('⚠️ No Service Account configured - cannot write to Google Sheets');
        return {
          success: false,
          error: 'Google Sheets write access requires Service Account credentials. Please configure GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY.'
        };
      }

      this.assertConfigured();

      // Fetch full range to locate row and map columns dynamically
      const request: any = {
        spreadsheetId: this.spreadsheetId,
        range: 'campaigns!A:ZZ',
      };
      if (this.hasApiKey && !this.hasServiceAccount) {
        request.key = process.env.GOOGLE_SHEETS_API_KEY;
      }

      const response = await this.sheets.spreadsheets.values.get(request);
      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return { success: false, error: 'No data found in sheet' };
      }

      const headers = rows[0] as string[];

      // Find row index for campaign; data starts at row index 4 (5th row in sheet)
      const idCampaignIndex = headers.findIndex(h => h === 'id_campaign');
      if (idCampaignIndex === -1) {
        return { success: false, error: 'id_campaign column not found' };
      }

      let sheetRowIndex = -1;
      for (let i = 4; i < rows.length; i++) {
        if (rows[i][idCampaignIndex] === campaignId) {
          sheetRowIndex = i;
          break;
        }
      }

      if (sheetRowIndex === -1) {
        console.error('❌ Campaign not found:', campaignId);
        return { success: false, error: `Campaign with ID ${campaignId} not found` };
      }

      console.log('📋 Found campaign at sheet row:', sheetRowIndex + 1);

      // Build updates dynamically from headers
      const updates: Array<{ range: string; values: any[][] }> = [];
      const targetRowNumber = sheetRowIndex + 1; // 1-based

      const desiredColumns = [
        'platform',
        'contact_email',
        'spend_jpy',
        'date_live',
        'date_plan',
        'date_draft',
        'repurposable',
        'contract_name_dashboard',
        'status_dashboard',
        'date_status_updated'
      ];

      for (const key of desiredColumns) {
        let value = updateData[key];
        if (value === undefined || value === null) continue;
        
        // Special handling for date_status_updated - use full timestamp
        if (key === 'date_status_updated') {
          value = new Date().toISOString(); // Full ISO timestamp with date and time
          console.log(`🕒 Using full timestamp for date_status_updated: ${value}`);
        }
        
        const colIndex = headers.findIndex(h => h === key);
        if (colIndex === -1) {
          console.log(`ℹ️ Column "${key}" not found in sheet headers; skipping.`);
          continue;
        }
        const range = `campaigns!${this.columnIndexToLetter(colIndex)}${targetRowNumber}`;
        updates.push({ range, values: [[String(value)]] });
        console.log(`📊 Queued update ${key} at ${range} = "${value}"`);
      }

      if (updates.length === 0) {
        console.error('❌ No valid updates to perform');
        return { success: false, error: 'No valid updates to perform' };
      }

      const batchUpdateRequest = {
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: updates
        }
      };

      console.log('📡 Executing onboarding batch update with', updates.length, 'updates');
      await this.sheets.spreadsheets.values.batchUpdate(batchUpdateRequest);
      console.log('✅ Campaign onboarding update completed successfully');
      // Invalidate campaigns-related caches
      this.invalidateCacheByPrefixes(['campaigns!']);
      return { success: true };

    } catch (error: any) {
      console.error('❌ Error updating campaign onboarding:', error?.message || error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  // Update selected influencer outreach status
  async updateSelectedInfluencerStatus(
    influencerId: string,
    dateOutreach: string,
    status: string = 'Reached out'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📝 GoogleSheetsService.updateSelectedInfluencerStatus() called');
      console.log('🎯 Influencer ID:', influencerId);
      console.log('📅 Date outreach:', dateOutreach);
      console.log('📊 Status:', status);

      // Ensure write access is possible
      if (!this.hasServiceAccount) {
        console.log('⚠️ No Service Account configured - cannot write to Google Sheets');
        return {
          success: false,
          error: 'Google Sheets write access requires Service Account credentials. Please configure GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY.'
        };
      }

      this.assertConfigured();

      // Fetch full range from "selected" sheet to locate row and map columns
      const request: any = {
        spreadsheetId: this.spreadsheetId,
        range: 'selected!A:ZZ', // Use "selected" sheet instead of "campaigns"
      };
      if (this.hasApiKey && !this.hasServiceAccount) {
        request.key = process.env.GOOGLE_SHEETS_API_KEY;
      }

      const response = await this.sheets.spreadsheets.values.get(request);
      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return { success: false, error: 'No data found in selected sheet' };
      }

      const headers = rows[0] as string[];
      console.log('📋 Headers in selected sheet:', headers);

      // Find row index for influencer; assuming data starts at row 2 (index 1)
      const idInfluencerIndex = headers.findIndex(h => h === 'id_influencer');
      if (idInfluencerIndex === -1) {
        return { success: false, error: 'id_influencer column not found in selected sheet' };
      }

      let sheetRowIndex = -1;
      for (let i = 1; i < rows.length; i++) { // Start from row 2 (index 1)
        if (rows[i][idInfluencerIndex] === influencerId) {
          sheetRowIndex = i;
          break;
        }
      }

      if (sheetRowIndex === -1) {
        console.error('❌ Influencer not found in selected sheet:', influencerId);
        return { success: false, error: `Influencer with ID ${influencerId} not found in selected sheet` };
      }

      console.log('📋 Found influencer at sheet row:', sheetRowIndex + 1);

      // Build updates for date_outreach and status columns
      const updates: Array<{ range: string; values: any[][] }> = [];
      const targetRowNumber = sheetRowIndex + 1; // 1-based

      // Update date_outreach column (G)
      const dateOutreachIndex = headers.findIndex(h => h === 'date_outreach');
      if (dateOutreachIndex !== -1) {
        const dateRange = `selected!${this.columnIndexToLetter(dateOutreachIndex)}${targetRowNumber}`;
        updates.push({ range: dateRange, values: [[dateOutreach]] });
        console.log(`📅 Queued date_outreach update at ${dateRange} = "${dateOutreach}"`);
      }

      // Update status column (F)
      const statusIndex = headers.findIndex(h => h === 'status');
      if (statusIndex !== -1) {
        const statusRange = `selected!${this.columnIndexToLetter(statusIndex)}${targetRowNumber}`;
        updates.push({ range: statusRange, values: [[status]] });
        console.log(`📊 Queued status update at ${statusRange} = "${status}"`);
      }

      if (updates.length === 0) {
        console.error('❌ No valid columns found to update');
        return { success: false, error: 'No valid columns found to update (date_outreach or status)' };
      }

      const batchUpdateRequest = {
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: updates
        }
      };

      console.log('📡 Executing selected sheet batch update with', updates.length, 'updates');
      await this.sheets.spreadsheets.values.batchUpdate(batchUpdateRequest);
      console.log('✅ Selected influencer status update completed successfully');
      // Invalidate selected sheet caches
      this.invalidateCacheByPrefixes(['selected!']);
      return { success: true };

    } catch (error: any) {
      console.error('❌ Error updating selected influencer status:', error?.message || error);
      return { success: false, error: error?.message || 'Unknown error' };
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

// Extend the service with template persistence helpers
export interface TemplateRuleSheetFormat {
  id: number;
  name: string;
  conditions: Array<{ field: string; operator: string; value: string }>;
  subject: string;
  body: string;
}

declare module './google-sheets' {}

// Monkey-patch methods onto the prototype to avoid disrupting existing exports
(GoogleSheetsService as any).prototype.getTemplates = async function(): Promise<TemplateRuleSheetFormat[]> {
  try {
    console.log('🔍 GoogleSheetsService.getTemplates() called');
    this.assertConfigured();

    const request: any = {
      spreadsheetId: this.spreadsheetId,
      range: 'templates!A:ZZ',
    };

    if (this.hasApiKey && !this.hasServiceAccount) {
      request.key = process.env.GOOGLE_SHEETS_API_KEY;
      console.log('🔑 Using API Key authentication for templates read');
    } else if (this.hasServiceAccount) {
      console.log('🔑 Using Service Account authentication for templates read');
    }

    const response = await this.sheets.spreadsheets.values.get(request);
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('ℹ️ No template rows found');
      return [];
    }

    const headers = rows[0] as string[];
    const idIndex = headers.findIndex(h => h === 'id');
    const nameIndex = headers.findIndex(h => h === 'name');
    const conditionsIndex = headers.findIndex(h => h === 'conditions_json');
    const subjectIndex = headers.findIndex(h => h === 'subject');
    const bodyIndex = headers.findIndex(h => h === 'body');

    const dataRows = rows.slice(1);
    const templates: TemplateRuleSheetFormat[] = dataRows.map((row: any[], index: number) => {
      let parsedConditions: Array<{ field: string; operator: string; value: string }> = [];
      const raw = row[conditionsIndex] || '[]';
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) parsedConditions = parsed;
      } catch (e) {
        console.log('⚠️ Failed to parse conditions_json, defaulting to []');
      }

      const idValue = row[idIndex];
      const idNumber = Number.isFinite(Number(idValue)) ? Number(idValue) : Date.now() + index;

      return {
        id: idNumber,
        name: row[nameIndex] || `template_${index}`,
        conditions: parsedConditions,
        subject: row[subjectIndex] || '',
        body: row[bodyIndex] || ''
      };
    });

    console.log('✅ Loaded templates from sheet:', templates.length);
    // Cache templates range as well
    try {
      const headers = rows[0] as string[];
      const normalizedObjects = rows.slice(1).map((row: any) => {
        const obj: any = {};
        headers.forEach((h, i) => { obj[h] = row[i] || ''; });
        return obj;
      });
      this.setCache(`${this.spreadsheetId}:templates!A:ZZ`, normalizedObjects);
    } catch {}
    return templates;
  } catch (error: any) {
    if (error?.code === 'GOOGLE_SHEETS_NOT_CONFIGURED') {
      throw error;
    }
    console.error('❌ Error loading templates from Google Sheets:', error?.message || error);
    throw error;
  }
};

(GoogleSheetsService as any).prototype.saveTemplates = async function(templates: TemplateRuleSheetFormat[]): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('💾 GoogleSheetsService.saveTemplates() called with', templates.length, 'templates');

    if (!this.hasServiceAccount) {
      console.log('⚠️ No Service Account configured - cannot write templates to Google Sheets');
      return { success: false, error: 'Write access requires GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY.' };
    }

    this.assertConfigured();

    // Prepare values with header
    const header = ['id', 'name', 'conditions_json', 'subject', 'body'];
    const values = [header, ...templates.map(t => [
      String(t.id),
      t.name,
      JSON.stringify(t.conditions || []),
      t.subject,
      t.body
    ])];

    // Clear existing range
    await this.sheets.spreadsheets.values.clear({
      spreadsheetId: this.spreadsheetId,
      range: 'templates!A:ZZ'
    });

    // Write new values
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: 'templates!A1',
      valueInputOption: 'RAW',
      requestBody: { values }
    });

    console.log('✅ Templates saved to Google Sheets');
    // Invalidate templates cache
    this.invalidateCacheByPrefixes(['templates!']);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error saving templates to Google Sheets:', error?.message || error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
};
