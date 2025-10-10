import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Login API called');
    const { id, password } = await request.json();
    console.log('👤 Login attempt for ID:', id);
    console.log('🔑 Password provided:', password ? 'Yes' : 'No');
    console.log('📝 Password length:', password?.length || 0);
    console.log('📝 Password value:', password);

    if (!id || !password) {
      console.log('❌ Missing credentials');
      return NextResponse.json(
        { error: 'ID and password are required' },
        { status: 400 }
      );
    }

    // Authenticate user using Google Sheets
    let user: any = null;
    try {
      console.log('📊 Attempting Google Sheets authentication...');
      console.log('🔍 Searching for user with ID:', id);
      console.log('🔑 Checking password:', password);
      user = await googleSheetsService.authenticateUser(id, password);
      console.log('✅ Authentication result:', user ? 'Success' : 'Failed');
      if (user) {
        console.log('👤 User found:', { id: user.id, name: user.name, email: user.email });
      } else {
        console.log('❌ No user found with provided credentials');
      }
    } catch (err: any) {
      console.log('❌ Google Sheets error:', err?.message || err);
      if (err?.code === 'GOOGLE_SHEETS_NOT_CONFIGURED') {
        console.log('⚠️ Google Sheets not configured, returning 503');
        return NextResponse.json(
          { error: 'Google Sheets credentials not configured' },
          { status: 503 }
        );
      }
      throw err;
    }

    if (user) {
      // Determine user role based on email domain or specific IDs
      const role = user.email?.includes('@usespeak.com') || id === 'admin' ? 'admin' : 'influencer';
      console.log('👤 User authenticated successfully:', { id: user.id, role });
      
      // Update date_status_updated for campaigns with status "not_started" or empty on login
      if (role === 'influencer') {
        console.log('🔄 Checking campaigns for date_status_updated update on login...');
        try {
          const updateResult = await googleSheetsService.updateDateStatusUpdatedOnLogin(user.id);
          if (updateResult.success && updateResult.updatedCount > 0) {
            console.log(`✅ Updated date_status_updated for ${updateResult.updatedCount} campaign(s) on login`);
          } else if (updateResult.success && updateResult.updatedCount === 0) {
            console.log('ℹ️ No campaigns needed date_status_updated update (all have statuses other than not_started/empty)');
          } else {
            console.log('⚠️ Failed to update date_status_updated on login:', updateResult.error);
          }
        } catch (updateError) {
          console.error('❌ Error updating date_status_updated on login:', updateError);
          // Don't fail login if update fails - just log the error
        }
      }
      
      return NextResponse.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        platform: user.platform,
        channelUrl: user.channelUrl,
        statusDashboard: user.statusDashboard,
      });
    }

    console.log('❌ Invalid credentials for ID:', id);
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Authentication API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
