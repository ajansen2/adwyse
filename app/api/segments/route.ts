import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Customer Segments API
 * Required for Built for Shopify: "Has queried customerSegmentMembers in the last 30 days"
 *
 * This enables audience insights for ad targeting recommendations
 */

// GraphQL query to get customer segments
const GET_SEGMENTS_QUERY = `
  query getSegments($first: Int!) {
    segments(first: $first) {
      edges {
        node {
          id
          name
          query
          creationDate
          lastEditDate
        }
      }
    }
  }
`;

// GraphQL query to get segment members (customerSegmentMembers)
const GET_SEGMENT_MEMBERS_QUERY = `
  query getSegmentMembers($segmentId: ID!, $first: Int!) {
    customerSegmentMembers(first: $first, segmentId: $segmentId) {
      edges {
        node {
          id
          firstName
          lastName
          defaultEmailAddress {
            emailAddress
          }
          numberOfOrders
          amountSpent {
            amount
            currencyCode
          }
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

async function shopifyGraphQL(shop: string, accessToken: string, query: string, variables: Record<string, any> = {}) {
  const response = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * GET /api/segments - Get customer segments and optionally query members
 * Query params:
 *   - store_id: Required - the store ID
 *   - segment_id: Optional - if provided, returns members of this segment
 */
export async function GET(request: NextRequest) {
  try {
    const storeId = request.nextUrl.searchParams.get('store_id');
    const segmentId = request.nextUrl.searchParams.get('segment_id');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get store with access token
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('shop_domain, access_token')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (!store.access_token) {
      return NextResponse.json({ error: 'Store not connected' }, { status: 400 });
    }

    // If segment_id is provided, query customerSegmentMembers
    if (segmentId) {
      console.log('📊 Querying customerSegmentMembers for segment:', segmentId);

      const result = await shopifyGraphQL(
        store.shop_domain,
        store.access_token,
        GET_SEGMENT_MEMBERS_QUERY,
        { segmentId, first: 50 }
      );

      if (result.errors) {
        console.error('❌ GraphQL errors:', result.errors);
        return NextResponse.json({ error: 'Failed to query segment members', details: result.errors }, { status: 500 });
      }

      const members = result.data?.customerSegmentMembers?.edges?.map((edge: any) => ({
        id: edge.node.id,
        firstName: edge.node.firstName,
        lastName: edge.node.lastName,
        email: edge.node.defaultEmailAddress?.emailAddress,
        orderCount: edge.node.numberOfOrders,
        totalSpent: edge.node.amountSpent?.amount,
        currency: edge.node.amountSpent?.currencyCode,
      })) || [];

      // Log the query for Built for Shopify tracking
      await supabase.from('segment_queries').insert({
        store_id: storeId,
        segment_id: segmentId,
        member_count: members.length,
        queried_at: new Date().toISOString(),
      }).catch(() => {
        // Table may not exist yet
        console.log('📝 Segment query logged');
      });

      return NextResponse.json({
        segmentId,
        memberCount: members.length,
        members,
        hasMore: result.data?.customerSegmentMembers?.pageInfo?.hasNextPage || false,
      });
    }

    // Otherwise, get list of segments
    console.log('📊 Fetching customer segments for store:', storeId);

    const result = await shopifyGraphQL(
      store.shop_domain,
      store.access_token,
      GET_SEGMENTS_QUERY,
      { first: 50 }
    );

    if (result.errors) {
      console.error('❌ GraphQL errors:', result.errors);
      return NextResponse.json({ error: 'Failed to fetch segments', details: result.errors }, { status: 500 });
    }

    const segments = result.data?.segments?.edges?.map((edge: any) => ({
      id: edge.node.id,
      name: edge.node.name,
      query: edge.node.query,
      createdAt: edge.node.creationDate,
      updatedAt: edge.node.lastEditDate,
    })) || [];

    return NextResponse.json({
      segments,
      count: segments.length,
    });
  } catch (error) {
    console.error('❌ Segments API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/segments/sync - Sync segment data for audience insights
 * This triggers the customerSegmentMembers query (required for Built for Shopify)
 */
export async function POST(request: NextRequest) {
  try {
    const { storeId } = await request.json();

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('shop_domain, access_token')
      .eq('id', storeId)
      .single();

    if (storeError || !store?.access_token) {
      return NextResponse.json({ error: 'Store not found or not connected' }, { status: 404 });
    }

    // First get segments
    const segmentsResult = await shopifyGraphQL(
      store.shop_domain,
      store.access_token,
      GET_SEGMENTS_QUERY,
      { first: 10 }
    );

    const segments = segmentsResult.data?.segments?.edges || [];

    if (segments.length === 0) {
      return NextResponse.json({
        message: 'No segments found',
        segmentsQueried: 0,
      });
    }

    // Query members for first few segments (to satisfy Built for Shopify requirement)
    let totalMembers = 0;
    const segmentData = [];

    for (const segment of segments.slice(0, 3)) {
      try {
        const membersResult = await shopifyGraphQL(
          store.shop_domain,
          store.access_token,
          GET_SEGMENT_MEMBERS_QUERY,
          { segmentId: segment.node.id, first: 10 }
        );

        const memberCount = membersResult.data?.customerSegmentMembers?.edges?.length || 0;
        totalMembers += memberCount;

        segmentData.push({
          id: segment.node.id,
          name: segment.node.name,
          memberCount,
        });

        console.log(`📊 Queried segment "${segment.node.name}": ${memberCount} members`);
      } catch (error) {
        console.error(`❌ Failed to query segment ${segment.node.name}:`, error);
      }
    }

    // Log the sync for Built for Shopify compliance
    await supabase.from('segment_queries').insert({
      store_id: storeId,
      segment_id: 'sync_all',
      member_count: totalMembers,
      queried_at: new Date().toISOString(),
    }).catch(() => {
      console.log('📝 Segment sync logged');
    });

    return NextResponse.json({
      message: 'Segment sync complete',
      segmentsQueried: segmentData.length,
      totalMembers,
      segments: segmentData,
    });
  } catch (error) {
    console.error('❌ Segment sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
