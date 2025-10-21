import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/google-sheets';
import { ChangeRequest, RequestType, RequestStatus } from '@/types';

/**
 * 申請管理APIエンドポイント
 * インフルエンサーからの変更申請の作成、取得、更新を管理します。
 */

export const dynamic = 'force-dynamic';

// GET: 申請一覧の取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const influencerId = searchParams.get('influencerId');
    const status = searchParams.get('status') as RequestStatus | null;

    console.log('📥 Fetching requests:', { campaignId, influencerId, status });

    // Google Sheetsから申請データを取得
    const requests = await getRequestsFromSheets({ campaignId, influencerId, status });

    return NextResponse.json({
      requests,
      count: requests.length,
    });
  } catch (error) {
    console.error('❌ Error fetching requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

// POST: 新しい申請の作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      campaignId,
      influencerId,
      influencerName,
      type,
      title,
      description,
      requestedChanges,
    } = body;

    console.log('📝 Creating new request:', {
      campaignId,
      influencerId,
      type,
      title,
    });

    // バリデーション
    if (!campaignId || !influencerId || !type || !title || !requestedChanges) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 申請IDを生成
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 申請データを作成
    const newRequest: ChangeRequest = {
      id: requestId,
      campaignId,
      influencerId,
      influencerName: influencerName || '',
      type: type as RequestType,
      title,
      description: description || '',
      requestedChanges: Array.isArray(requestedChanges) ? requestedChanges : [],
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Google Sheetsに保存
    await saveRequestToSheets(newRequest);

    console.log('✅ Request created successfully:', requestId);

    return NextResponse.json({
      success: true,
      request: newRequest,
      message: '申請が送信されました。管理者の承認をお待ちください。',
    });
  } catch (error) {
    console.error('❌ Error creating request:', error);
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    );
  }
}

// PATCH: 申請のステータス更新（管理者による承認/却下）
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      requestId,
      status,
      adminId,
      adminName,
      comment,
    } = body;

    console.log('🔄 Updating request:', { requestId, status });

    // バリデーション
    if (!requestId || !status || !adminId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "approved" or "rejected"' },
        { status: 400 }
      );
    }

    // 申請を取得
    const existingRequest = await getRequestById(requestId);
    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // 申請を更新
    const updatedRequest: ChangeRequest = {
      ...existingRequest,
      status: status as RequestStatus,
      updatedAt: new Date(),
      adminResponse: {
        adminId,
        adminName: adminName || '',
        comment: comment || '',
        respondedAt: new Date(),
      },
    };

    // Google Sheetsに保存
    await updateRequestInSheets(updatedRequest);

    // 承認された場合は、実際にキャンペーンデータを更新
    if (status === 'approved') {
      await applyRequestChanges(updatedRequest);
    }

    console.log('✅ Request updated successfully:', requestId);

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      message: status === 'approved' ? '申請を承認しました' : '申請を却下しました',
    });
  } catch (error: any) {
    console.error('❌ Error updating request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update request',
        details: error?.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

// ヘルパー関数: Google Sheetsから申請データを取得
async function getRequestsFromSheets(filters: {
  campaignId?: string | null;
  influencerId?: string | null;
  status?: RequestStatus | null;
}): Promise<ChangeRequest[]> {
  try {
    // requests_dashboard と log_events カラムから申請データを取得
    const columns = [
      'id_campaign',
      'id_influencer',
      'name',
      'requests_dashboard',
      'log_events',
    ];

    const rows = await googleSheetsService.getSpecificColumns(
      columns,
      filters.influencerId || undefined
    );

    const allRequests: ChangeRequest[] = [];

    for (const row of rows) {
      // 後方互換性のため、まずrequests_dashboardから取得
      const requestsJson = row['requests_dashboard'];
      if (requestsJson && typeof requestsJson === 'string') {
        try {
          const requests = JSON.parse(requestsJson);
          if (Array.isArray(requests)) {
            const parsedRequests = requests.map((req: any) => ({
              ...req,
              createdAt: new Date(req.createdAt),
              updatedAt: new Date(req.updatedAt),
              adminResponse: req.adminResponse ? {
                ...req.adminResponse,
                respondedAt: new Date(req.adminResponse.respondedAt),
              } : undefined,
            }));
            allRequests.push(...parsedRequests);
          }
        } catch (e) {
          console.error('Failed to parse requests JSON:', e);
        }
      }

      // log_eventsからも取得（新しいデータソース）
      // log_eventsのデータを使って申請一覧を構築
      const logEventsJson = row['log_events'];
      if (logEventsJson && typeof logEventsJson === 'string') {
        try {
          const events = JSON.parse(logEventsJson);
          if (Array.isArray(events)) {
            // change_request_created イベントから申請を構築
            const requestEvents = events.filter((e: any) => 
              e.event_type === 'change_request_created' ||
              e.event_type === 'change_request_approved' ||
              e.event_type === 'change_request_rejected'
            );

            // イベントをrequest IDでグループ化
            const requestMap = new Map<string, any>();
            for (const event of requestEvents) {
              const requestId = event.request_id;
              if (!requestMap.has(requestId)) {
                // 初期リクエストデータを作成
                if (event.event_type === 'change_request_created') {
                  requestMap.set(requestId, {
                    id: requestId,
                    campaignId: row['id_campaign'],
                    influencerId: event.influencer_id,
                    influencerName: event.influencer_name,
                    type: event.request_type,
                    title: event.title,
                    description: event.description || '',
                    requestedChanges: event.requested_changes || [],
                    status: event.status || 'pending',
                    createdAt: new Date(event.timestamp),
                    updatedAt: new Date(event.timestamp),
                  });
                }
              } else {
                // 承認/却下イベントで更新
                const existingRequest = requestMap.get(requestId);
                if (event.event_type === 'change_request_approved' || event.event_type === 'change_request_rejected') {
                  existingRequest.status = event.status;
                  existingRequest.updatedAt = new Date(event.timestamp);
                  if (event.admin_response) {
                    existingRequest.adminResponse = {
                      adminId: event.admin_response.admin_id,
                      adminName: event.admin_response.admin_name,
                      comment: event.admin_response.comment,
                      respondedAt: new Date(event.admin_response.responded_at),
                    };
                  }
                }
              }
            }

            // requests_dashboardで既に取得済みのIDは除外（重複を避ける）
            const existingIds = new Set(allRequests.map(r => r.id));
            const requestsFromEvents = Array.from(requestMap.values());
            for (const request of requestsFromEvents) {
              if (!existingIds.has(request.id)) {
                allRequests.push(request);
              }
            }
          }
        } catch (e) {
          console.error('Failed to parse log_events JSON:', e);
        }
      }
    }

    // フィルタリング
    let filteredRequests = allRequests;
    if (filters.campaignId) {
      filteredRequests = filteredRequests.filter(r => r.campaignId === filters.campaignId);
    }
    if (filters.status) {
      filteredRequests = filteredRequests.filter(r => r.status === filters.status);
    }

    // 最新順にソート
    filteredRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return filteredRequests;
  } catch (error) {
    console.error('Error fetching requests from sheets:', error);
    return [];
  }
}

// ヘルパー関数: IDで申請を取得
async function getRequestById(requestId: string): Promise<ChangeRequest | null> {
  const allRequests = await getRequestsFromSheets({});
  return allRequests.find(r => r.id === requestId) || null;
}

// ヘルパー関数: 申請をGoogle Sheetsに保存
async function saveRequestToSheets(request: ChangeRequest): Promise<void> {
  try {
    // 既存の申請データを取得
    const columns = ['id_campaign', 'id_influencer', 'requests_dashboard', 'log_events', 'status_dashboard'];
    const rows = await googleSheetsService.getSpecificColumns(columns, request.influencerId);
    const row = rows.find(r => r['id_campaign'] === request.campaignId);

    if (!row) {
      throw new Error('Campaign not found');
    }

    // 既存の申請配列を取得（requests_dashboard - 後方互換性のため維持）
    let existingRequests: any[] = [];
    if (row['requests_dashboard'] && typeof row['requests_dashboard'] === 'string') {
      try {
        existingRequests = JSON.parse(row['requests_dashboard']);
        if (!Array.isArray(existingRequests)) {
          existingRequests = [];
        }
      } catch (e) {
        console.warn('Failed to parse existing requests, starting fresh');
      }
    }

    // 新しい申請を追加
    existingRequests.push(request);

    // log_eventsにも申請イベントを追加
    let logEvents: any[] = [];
    if (row['log_events'] && typeof row['log_events'] === 'string') {
      try {
        logEvents = JSON.parse(row['log_events']);
        if (!Array.isArray(logEvents)) {
          logEvents = [];
        }
      } catch (e) {
        console.warn('Failed to parse existing log_events, starting fresh');
      }
    }

    // log_eventsに新しいイベントを追加
    const logEvent = {
      event_type: 'change_request_created',
      timestamp: new Date().toISOString(),
      request_id: request.id,
      request_type: request.type,
      title: request.title,
      description: request.description,
      requested_changes: request.requestedChanges,
      influencer_id: request.influencerId,
      influencer_name: request.influencerName,
      status: request.status,
    };
    logEvents.push(logEvent);

    // Google Sheetsを更新（updateCampaignStatusメソッドを利用）
    await googleSheetsService.updateCampaignStatus(
      request.campaignId,
      request.influencerId,
      row['status_dashboard'] || 'not_started', // 現在のステータスを維持
      undefined,
      undefined,
      {
        type: 'requests_update',
        content: JSON.stringify(existingRequests),
        timestamp: new Date().toISOString(),
        log_events: JSON.stringify(logEvents), // log_eventsも一緒に更新
      }
    );

    console.log('✅ Request saved to sheets (requests_dashboard & log_events)');
  } catch (error) {
    console.error('Error saving request to sheets:', error);
    throw error;
  }
}

// ヘルパー関数: 申請をGoogle Sheetsで更新
async function updateRequestInSheets(request: ChangeRequest): Promise<void> {
  try {
    console.log('🔄 updateRequestInSheets: Starting update for request:', request.id);
    
    // 既存の申請データを取得
    const columns = ['id_campaign', 'id_influencer', 'requests_dashboard', 'log_events', 'status_dashboard'];
    console.log('📊 Fetching columns from Google Sheets...');
    const rows = await googleSheetsService.getSpecificColumns(columns, request.influencerId);
    console.log('📊 Rows fetched:', rows.length);
    
    const row = rows.find(r => r['id_campaign'] === request.campaignId);

    if (!row) {
      console.error('❌ Campaign not found:', request.campaignId);
      throw new Error('Campaign not found');
    }

    console.log('✅ Campaign row found:', request.campaignId);

    // 既存の申請配列を取得して更新（requests_dashboard）
    let existingRequests: any[] = [];
    if (row['requests_dashboard'] && typeof row['requests_dashboard'] === 'string') {
      try {
        existingRequests = JSON.parse(row['requests_dashboard']);
        if (!Array.isArray(existingRequests)) {
          existingRequests = [];
        }
        console.log('📋 Existing requests found:', existingRequests.length);
      } catch (e) {
        console.error('❌ Failed to parse existing requests:', e);
        throw new Error('Failed to parse existing requests');
      }
    }

    // 該当の申請を更新（存在しない場合は追加）
    const requestIndex = existingRequests.findIndex(r => r.id === request.id);
    if (requestIndex === -1) {
      console.warn('⚠️ Request not found in requests_dashboard, adding it:', request.id);
      // requests_dashboardに存在しない場合は追加（log_eventsから読み取ったケース）
      existingRequests.push(request);
    } else {
      console.log('✅ Request found at index:', requestIndex);
      existingRequests[requestIndex] = request;
    }

    // log_eventsにも更新イベントを追加
    let logEvents: any[] = [];
    const existingLogEventsStr = row['log_events'];
    console.log('📝 Existing log_events (raw):', existingLogEventsStr ? `${existingLogEventsStr.substring(0, 100)}...` : 'empty');
    
    if (existingLogEventsStr && typeof existingLogEventsStr === 'string') {
      try {
        logEvents = JSON.parse(existingLogEventsStr);
        if (!Array.isArray(logEvents)) {
          console.warn('⚠️ log_events is not an array, starting fresh');
          logEvents = [];
        } else {
          console.log('✅ Parsed existing log_events:', logEvents.length, 'events');
        }
      } catch (e) {
        console.warn('⚠️ Failed to parse existing log_events, starting fresh:', e);
        logEvents = [];
      }
    } else {
      console.log('ℹ️ No existing log_events, starting fresh');
    }

    // log_eventsに管理者対応のイベントを追加
    const logEvent = {
      event_type: request.status === 'approved' ? 'change_request_approved' : 'change_request_rejected',
      timestamp: new Date().toISOString(),
      request_id: request.id,
      request_type: request.type,
      title: request.title,
      influencer_id: request.influencerId,
      influencer_name: request.influencerName,
      status: request.status,
      admin_response: request.adminResponse ? {
        admin_id: request.adminResponse.adminId,
        admin_name: request.adminResponse.adminName,
        comment: request.adminResponse.comment,
        responded_at: request.adminResponse.respondedAt.toISOString(),
      } : undefined,
      applied_changes: request.status === 'approved' ? request.requestedChanges : undefined,
    };
    logEvents.push(logEvent);
    console.log('✅ Added new log event:', logEvent.event_type);
    console.log('📊 Total log events to save:', logEvents.length);

    // Google Sheetsを更新
    console.log('📡 Calling updateCampaignStatus...');
    const updateResult = await googleSheetsService.updateCampaignStatus(
      request.campaignId,
      request.influencerId,
      row['status_dashboard'] || 'not_started',
      undefined,
      undefined,
      {
        type: 'requests_update',
        content: JSON.stringify(existingRequests),
        timestamp: new Date().toISOString(),
        log_events: JSON.stringify(logEvents), // log_eventsも一緒に更新
      }
    );

    if (!updateResult.success) {
      console.error('❌ updateCampaignStatus failed:', updateResult.error);
      throw new Error(`Failed to update Google Sheets: ${updateResult.error}`);
    }

    console.log('✅ Request updated in sheets (requests_dashboard & log_events)');
  } catch (error) {
    console.error('❌ Error updating request in sheets:', error);
    throw error;
  }
}

// ヘルパー関数: 承認された申請の変更を実際に適用
async function applyRequestChanges(request: ChangeRequest): Promise<void> {
  try {
    console.log('🔄 Applying approved request changes:', request.id);

    // 現在のキャンペーンデータを取得
    const columns = ['id_campaign', 'id_influencer', 'status_dashboard', 'date_plan', 'date_draft', 'date_live'];
    const rows = await googleSheetsService.getSpecificColumns(columns, request.influencerId);
    const row = rows.find(r => r['id_campaign'] === request.campaignId);

    if (!row) {
      throw new Error('Campaign not found');
    }

    // 申請タイプに応じて変更を適用
    // Google Sheets APIのbatchUpdateを使用して複数のセルを一度に更新
    const updates: Array<{ field: string; value: string }> = [];

    for (const change of request.requestedChanges) {
      switch (change.field) {
        case 'planDate':
          updates.push({ field: 'date_plan', value: change.newValue });
          break;
        case 'draftDate':
          updates.push({ field: 'date_draft', value: change.newValue });
          break;
        case 'liveDate':
          updates.push({ field: 'date_live', value: change.newValue });
          break;
        default:
          console.warn('Unknown field:', change.field);
      }
    }

    // 各フィールドを個別に更新
    // Note: updateCampaignStatusは主にstatus更新用だが、メッセージで記録を残せる
    for (const update of updates) {
      // 日付フィールドの直接更新のため、updateCampaignOnboardingを使用
      // または、新しい更新メソッドが必要
      console.log(`📅 Need to update ${update.field} to ${update.value}`);
    }

    // 暫定的に、updateCampaignOnboardingを使用して日付を更新
    // より適切な実装は、Google Sheets APIに直接アクセスする新しいメソッドを追加すること
    const updateData: any = {};
    for (const update of updates) {
      updateData[update.field] = update.value;
    }

    await googleSheetsService.updateCampaignOnboarding(
      request.campaignId,
      updateData
    );

    console.log('✅ Request changes applied successfully');
  } catch (error) {
    console.error('Error applying request changes:', error);
    throw error;
  }
}

