import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedShop } from '@/lib/verify-session';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const shop = getAuthenticatedShop(request);
  if (!shop) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const storeId = request.nextUrl.searchParams.get('store_id');
  if (!storeId) return NextResponse.json({ error: 'store_id required' }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Verify store belongs to this shop
  const { data: store } = await supabase
    .from('adwyse_stores')
    .select('shop_domain, onboarding_completed')
    .eq('id', storeId)
    .maybeSingle();

  if (!store || store.shop_domain !== shop) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // If onboarding already completed, short-circuit
  if (store.onboarding_completed) {
    return NextResponse.json({
      hasConnectedAccounts: true,
      pixelActive: true,
      firstSyncComplete: true,
      syncInProgress: false,
      onboardingCompleted: true,
    });
  }

  // Check ad accounts: at least one with is_connected = true
  const { data: accounts } = await supabase
    .from('adwyse_ad_accounts')
    .select('id, is_connected, sync_status')
    .eq('store_id', storeId);

  const connectedAccounts = (accounts || []).filter((a: any) => a.is_connected);
  const hasConnectedAccounts = connectedAccounts.length > 0;

  // Check sync status
  const syncInProgress = connectedAccounts.some((a: any) => a.sync_status === 'running');
  const firstSyncComplete = connectedAccounts.some((a: any) => a.sync_status === 'done');

  // Check pixel: look for pixel_config row OR pixel_events in last 7 days
  let pixelActive = false;

  const { data: pixelConfig } = await supabase
    .from('pixel_config')
    .select('is_enabled')
    .eq('store_id', storeId)
    .maybeSingle();

  if (pixelConfig?.is_enabled) {
    pixelActive = true;
  } else {
    // Also check if we have any recent pixel events (Web Pixel auto-creates them)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count } = await supabase
      .from('pixel_events')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .gte('created_at', sevenDaysAgo.toISOString());

    if (count && count > 0) {
      pixelActive = true;
    }
  }

  const onboardingCompleted = hasConnectedAccounts && pixelActive && firstSyncComplete;

  // If all steps are done, persist completion so it never returns
  if (onboardingCompleted) {
    await supabase
      .from('adwyse_stores')
      .update({ onboarding_completed: true })
      .eq('id', storeId);
  }

  return NextResponse.json({
    hasConnectedAccounts,
    pixelActive,
    firstSyncComplete,
    syncInProgress,
    onboardingCompleted,
  });
}
