import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { analyzeCreativeFatigue, generateFatigueAlertMessage, type CreativePerformance } from '@/lib/creative-fatigue';

/**
 * Creative Fatigue Check Cron
 * Runs daily to analyze creative performance and create fatigue alerts
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all active stores
    const { data: stores, error: storesError } = await supabase
      .from('adwyse_stores')
      .select('id, store_name, shop_domain')
      .eq('status', 'active');

    if (storesError) {
      console.error('Error fetching stores:', storesError);
      return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
    }

    const results: { storeId: string; alertsCreated: number; fatigued: string[] }[] = [];

    for (const store of stores || []) {
      try {
        // Get creative performance data (last 14 days, grouped by day)
        const { data: creatives, error: creativesError } = await supabase
          .from('ad_creatives')
          .select(`
            id,
            name,
            platform,
            creative_performance(
              date,
              spend,
              impressions,
              clicks,
              conversions,
              revenue
            )
          `)
          .eq('store_id', store.id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        if (creativesError) {
          console.error(`Error fetching creatives for store ${store.id}:`, creativesError);
          continue;
        }

        if (!creatives || creatives.length === 0) {
          results.push({ storeId: store.id, alertsCreated: 0, fatigued: [] });
          continue;
        }

        const fatiguedCreatives: string[] = [];
        let alertsCreated = 0;

        for (const creative of creatives) {
          // Transform to CreativePerformance format
          const performance: CreativePerformance = {
            creativeId: creative.id,
            creativeName: creative.name || 'Unnamed Creative',
            platform: creative.platform || 'unknown',
            periods: (creative.creative_performance || []).map((p: any) => ({
              date: p.date,
              spend: p.spend || 0,
              impressions: p.impressions || 0,
              clicks: p.clicks || 0,
              conversions: p.conversions || 0,
              revenue: p.revenue || 0
            }))
          };

          // Analyze for fatigue
          const analysis = analyzeCreativeFatigue(performance);

          if (analysis.isFatigued && analysis.severity !== 'low') {
            fatiguedCreatives.push(creative.name || creative.id);

            // Check if we already have a recent alert for this creative
            const { data: existingAlert } = await supabase
              .from('alerts')
              .select('id')
              .eq('store_id', store.id)
              .eq('alert_type', 'creative_fatigue')
              .eq('metadata->>creativeId', creative.id)
              .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
              .maybeSingle();

            if (!existingAlert) {
              // Create fatigue alert
              const { error: alertError } = await supabase
                .from('alerts')
                .insert({
                  store_id: store.id,
                  alert_type: 'creative_fatigue',
                  severity: analysis.severity,
                  title: `Creative Fatigue: ${analysis.creativeName}`,
                  message: generateFatigueAlertMessage(analysis),
                  metadata: {
                    creativeId: creative.id,
                    creativeName: analysis.creativeName,
                    platform: analysis.platform,
                    fatigueScore: analysis.fatigueScore,
                    indicators: analysis.indicators,
                    peakRoas: analysis.peakRoas,
                    currentRoas: analysis.currentRoas,
                    recommendation: analysis.recommendation
                  },
                  status: 'pending'
                });

              if (!alertError) {
                alertsCreated++;
              }
            }
          }
        }

        results.push({
          storeId: store.id,
          alertsCreated,
          fatigued: fatiguedCreatives
        });
      } catch (error) {
        console.error(`Error processing store ${store.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      storesProcessed: stores?.length || 0,
      results
    });

  } catch (error) {
    console.error('Error in creative fatigue check:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
