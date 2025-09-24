import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/google-sheets';
import type { GoogleSheetsRow } from '@/lib/google-sheets';
import { emailService, EmailMessage } from '@/lib/email-service';

// Types for the Comms functionality
interface InfluencerData {
  id: string;
  name: string;
  email: string;
  platform: string;
  outreachType: string;
  previousContact: boolean;
  teamMemberName: string;
  status: string;
  dateOutreach: string;
}

interface MessageTemplate {
  subject: string;
  body: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Comms API: Fetching selected influencers from Google Sheets');
    
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    
    if (action === 'getSelectedInfluencers') {
      // Fetch data from the "selected" tab using correct headers
      const selectedInfluencers = await googleSheetsService.getSpecificColumns([
        'id_influencer', // B column - Influencer ID
        'name', // C column - Influencer name (English)
        'インフルエンサー名', // C column - Influencer name (Japanese)
        'influencer_name', // Alternative name column
        'contact_email', // K column - Email
        'platform', // M column - Platform (yt, yts, tw, sv, pc, etc.)
        'sender', // Z column - Team member/sender name
        'had_response', // Previous contact indicator
        'status', // F column - Status filter
        'date_outreach', // G column - Date outreach
      ], undefined, 'selected');

      console.log('📊 Selected influencers data:', selectedInfluencers.length);

      // Deduplicate by id_influencer, preferring the last (lowest) row in the sheet
      const latestById = new Map<string, GoogleSheetsRow>();
      selectedInfluencers.forEach((row) => {
        const id = row['id_influencer'];
        if (!id) return;
        // Overwrite to keep the last occurrence
        latestById.set(id, row);
      });

      // Filter and transform the data (on deduped rows)
      const NAME_PLACEHOLDER = '【名前未入力】';
      const formattedInfluencers: InfluencerData[] = Array.from(latestById.values())
        .filter((row: GoogleSheetsRow) => {
          // Only include rows where status is Selected or empty
          const rawStatus = (row['status'] || '').trim();
          const statusLower = rawStatus.toLowerCase();
          const isValidStatus = statusLower === 'selected' || rawStatus === '';
          
          console.log(`Filtering influencer ${row['name']}: status="${rawStatus}" (length: ${rawStatus.length}), valid=${isValidStatus}`);
          
          return isValidStatus;
        })
        .map((row, index) => {
          // Search for name in all possible column variations (same logic as getUsers method)
          const possibleNames = [
            row['インフルエンサー名'],
            row['name'],
            row['Name'],
            row['influencer_name'],
            row['influencer name'],
            row['Influencer Name']
          ].filter(Boolean);
          
          const firstNameCandidate = String((possibleNames as unknown as string[])[0] || '');
          const influencerName = firstNameCandidate.trim() !== '' 
            ? firstNameCandidate 
            : NAME_PLACEHOLDER;

          return {
            id: row['id_influencer'] || `selected_${index}`,
            name: influencerName,
            email: row['contact_email'] || '',
            platform: row['platform'] || 'yt',
            outreachType: '', // No longer using Google Sheets template column
            previousContact: row['had_response'] === 'TRUE' || row['had_response'] === '1',
            teamMemberName: row['sender'] || '',
            status: row['status'] || '',
            dateOutreach: row['date_outreach'] || '',
          };
        });

      console.log('✅ Formatted influencers:', formattedInfluencers.length);

      return NextResponse.json({
        success: true,
        influencers: formattedInfluencers
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action parameter' 
    }, { status: 400 });

  } catch (error: any) {
    console.error('❌ Error in Comms API:', error);
    
    if (error?.code === 'GOOGLE_SHEETS_NOT_CONFIGURED') {
      return NextResponse.json({
        success: false,
        error: 'Google Sheets not configured. Please set up credentials.',
        configured: false
      }, { status: 503 });
    }

    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed to fetch influencers data'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Comms API: Processing email send request');
    
    const body = await request.json();
    const { action, influencerIds, teamMemberName, customMessage, subject, templateType } = body;

    if (action === 'generateMessages') {
      // Generate messages for selected influencers
      const selectedInfluencers = await googleSheetsService.getSpecificColumns([
        'id_influencer', // B column
        'name', // C column - Influencer name (English)
        'インフルエンサー名', // C column - Influencer name (Japanese)
        'influencer_name', // Alternative name column
        'contact_email', // K column  
        'platform', // M column
        'had_response', // Previous contact indicator
        'sender', // Z column - team member name
        'status', // F column - Status
        'date_outreach', // G column - Date outreach
      ], undefined, 'selected');

      // Deduplicate by id_influencer, keeping the last (lowest) row
      const latestById = new Map<string, GoogleSheetsRow>();
      selectedInfluencers.forEach((row) => {
        const id = row['id_influencer'];
        if (!id) return;
        latestById.set(id, row); // overwrite to keep later row
      });

      // Filter to only requested influencer IDs
      const targetInfluencers = influencerIds
        .map((id: string) => latestById.get(id))
        .filter((row: GoogleSheetsRow | undefined): row is GoogleSheetsRow => Boolean(row));

      const NAME_PLACEHOLDER = '【名前未入力】';
      const messages = await Promise.all(
        targetInfluencers.map(async (influencer: GoogleSheetsRow) => {
          // Search for name in all possible column variations (same logic as above)
          const possibleNames = [
            influencer['インフルエンサー名'],
            influencer['name'],
            influencer['Name'],
            influencer['influencer_name'],
            influencer['influencer name'],
            influencer['Influencer Name']
          ].filter(Boolean);
          
          const firstNameCandidate = String((possibleNames as unknown as string[])[0] || '');
          const nameForTemplate = firstNameCandidate.trim() !== '' 
            ? firstNameCandidate 
            : NAME_PLACEHOLDER;
          const messageTemplate = await generateMessageTemplate(
            nameForTemplate,
            influencer['platform'] || 'yt',
            templateType || 'リーチアウト', // Use web interface template selection
            influencer['had_response'] === 'TRUE' || influencer['had_response'] === '1',
            teamMemberName,
            templateType || 'リーチアウト' // Default to リーチアウト
          );

          return {
            influencerId: influencer['id_influencer'],
            influencerName: nameForTemplate,
            email: influencer['contact_email'],
            subject: messageTemplate.subject,
            body: customMessage || messageTemplate.body,
          };
        })
      );

      return NextResponse.json({
        success: true,
        messages
      });
    }

    if (action === 'markAsSent') {
      const { influencerId } = body;
      
      if (!influencerId) {
        return NextResponse.json({
          success: false,
          error: 'Influencer ID is required'
        }, { status: 400 });
      }

      console.log('📝 Marking influencer as sent:', influencerId);
      
      try {
        // Update Google Sheets for this influencer
        const currentDate = new Date().toISOString().split('T')[0]; // yyyy-mm-dd format
        await updateInfluencerOutreachStatus(influencerId, currentDate);
        
        return NextResponse.json({
          success: true,
          message: 'Successfully marked as sent'
        });
      } catch (error: any) {
        console.error('❌ Failed to mark as sent:', error);
        return NextResponse.json({
          success: false,
          error: error?.message || 'Failed to mark as sent'
        }, { status: 500 });
      }
    }

    if (action === 'sendEmails') {
      const { messages } = body;
      
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No messages provided'
        }, { status: 400 });
      }

      console.log('📧 Sending emails to:', messages.length, 'recipients');
      
      // Convert messages to EmailMessage format
      const emailMessages: EmailMessage[] = messages.map((msg: any) => ({
        to: msg.email,
        subject: msg.subject,
        body: msg.body,
        from: 'partnerships_jp@usespeak.com'
      }));

      // Send emails using the email service
      const result = await emailService.sendBulkEmails(emailMessages);
      
      if (result.success) {
        // Update Google Sheets for successfully sent emails
        const currentDate = new Date().toISOString().split('T')[0]; // yyyy-mm-dd format
        const updatePromises = messages
          .filter((msg: any, index: number) => result.results[index]?.success)
          .map(async (msg: any) => {
            try {
              // Update date_outreach and status for this influencer
              await updateInfluencerOutreachStatus(msg.influencerId, currentDate);
              console.log(`✅ Updated outreach status for ${msg.influencerName}`);
            } catch (error) {
              console.error(`❌ Failed to update outreach status for ${msg.influencerName}:`, error);
            }
          });

        // Wait for all updates to complete (but don't fail if some updates fail)
        await Promise.allSettled(updatePromises);

        return NextResponse.json({
          success: true,
          message: `Successfully sent ${result.successCount} emails${result.failureCount > 0 ? ` (${result.failureCount} failed)` : ''}`,
          sentCount: result.successCount,
          failedCount: result.failureCount,
          results: result.results
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Failed to send emails',
          results: result.results
        }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action parameter' 
    }, { status: 400 });

  } catch (error: any) {
    console.error('❌ Error in Comms API POST:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed to process request'
    }, { status: 500 });
  }
}

// Helper function to update influencer outreach status in Google Sheets
async function updateInfluencerOutreachStatus(influencerId: string, date: string): Promise<void> {
  try {
    console.log(`📝 Updating outreach status for influencer ${influencerId}`);
    
    // Use the new dedicated method for updating selected sheet
    const result = await googleSheetsService.updateSelectedInfluencerStatus(
      influencerId,
      date,
      'Reached out'
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update influencer status');
    }
    
    console.log(`✅ Successfully updated outreach status for influencer ${influencerId}`);
    
  } catch (error) {
    console.error(`❌ Failed to update outreach status:`, error);
    throw error;
  }
}

// Normalize/mapping helpers for template matching
function expandOutreachType(outreachType: string): string[] {
  const value = (outreachType || '').trim();
  // Map Japanese UI selections to internal variants used by templates
  if (value === 'リーチアウト' || value === '初回アウトリーチ') {
    return ['リーチアウト', '初回アウトリーチ', '1st time outreach'];
  }
  if (value === 'PR準備') {
    return ['PR準備', 'PR prep'];
  }
  if (value === '2回目アウトリーチ') {
    return ['2回目アウトリーチ', '2nd Outreach'];
  }
  return [value];
}

function expandPlatformForTemplates(platform: string): string[] {
  const value = (platform || '').trim().toLowerCase();
  // Accept common synonyms and bridge yts<->sv for ショート動画
  if (value === 'yts') return ['yts', 'sv'];
  if (value === 'sv') return ['sv', 'yts'];
  if (value === 'youtube' || value === 'youtube_long') return ['yt'];
  if (value === 'youtube_short' || value === 'youtube_shorts') return ['yts', 'sv'];
  return [value || 'yt'];
}

// Generate message template using dynamic templates from Settings
async function generateMessageTemplate(
  influencerName: string,
  platform: string,
  outreachType: string,
  previousContact: boolean,
  teamMemberName: string,
  templateType: string = 'リーチアウト'
): Promise<MessageTemplate> {
  const greeting = previousContact ? "お世話になっております" : "初めまして";
  
  try {
    // Fetch dynamic templates from Settings (support vercel/production URLs)
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` ||
      process.env.APP_URL ||
      'http://localhost:3000';
    const templatesResponse = await fetch(`${baseUrl}/api/templates`);
    const templatesData = await templatesResponse.json();
    
    if (templatesData.success) {
      // Try expanded combinations of platform/outreachType for robust matching
      const platformCandidates = expandPlatformForTemplates(platform);
      const outreachCandidates = expandOutreachType(outreachType);

      for (const p of platformCandidates) {
        for (const o of outreachCandidates) {
          const matchingTemplate = findMatchingTemplate({
            platform: p,
            outreachType: o,
            previousContact
          }, templatesData.templates);
          if (matchingTemplate) {
            const processedSubject = matchingTemplate.subject
              .replace(/{influencerName}/g, influencerName)
              .replace(/{teamMemberName}/g, teamMemberName)
              .replace(/{greeting}/g, greeting)
              .replace(/{platform}/g, p);
            const processedBody = matchingTemplate.body
              .replace(/{influencerName}/g, influencerName)
              .replace(/{teamMemberName}/g, teamMemberName)
              .replace(/{greeting}/g, greeting)
              .replace(/{platform}/g, p);
            return {
              subject: processedSubject,
              body: processedBody
            };
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error fetching dynamic templates, falling back to error message:', error);
  }
  
  // If no template found, return an error message instead of hardcoded fallback
  return {
    subject: `Template Error - ${influencerName}様`,
    body: `Template matching error for:
- Platform: ${platform}
- Outreach Type: ${outreachType}
- Previous Contact: ${previousContact}

Please check Settings/Templates to ensure a matching template exists.

Debug info:
- Template Type: ${templateType}
- Influencer: ${influencerName}
- Team Member: ${teamMemberName}`
  };
}

// Helper function to match template rules against influencer data
function findMatchingTemplate(
  influencerData: {
    platform: string;
    outreachType: string;
    previousContact: boolean;
  },
  templates: Array<{
    id: number;
    name: string;
    conditions: Array<{
      field: string;
      operator: string;
      value: string;
    }>;
    subject: string;
    body: string;
  }>
): any | null {
  
  for (const template of templates) {
    let matches = true;
    
    for (const condition of template.conditions) {
      const { field, operator, value } = condition;
      let fieldValue: any;
      
      switch (field) {
        case 'platform':
          fieldValue = influencerData.platform;
          break;
        case 'outreachType':
          fieldValue = influencerData.outreachType;
          break;
        case 'previousContact':
          fieldValue = influencerData.previousContact ? 'true' : 'false';
          break;
        default:
          fieldValue = '';
      }
      
      switch (operator) {
        case '=':
          if (fieldValue !== value) matches = false;
          break;
        case '!=':
          if (fieldValue === value) matches = false;
          break;
        case 'contains':
          if (!fieldValue.toString().includes(value)) matches = false;
          break;
        default:
          matches = false;
      }
      
      if (!matches) break;
    }
    
    if (matches) {
      return template;
    }
  }
  
  return null;
}
