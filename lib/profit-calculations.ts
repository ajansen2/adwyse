/**
 * Profit Calculations
 * Helpers for calculating COGS, gross profit, and true ROAS
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types
export interface ProductCost {
  id: string;
  store_id: string;
  shopify_product_id: string;
  shopify_variant_id: string | null;
  sku: string | null;
  product_title: string | null;
  variant_title: string | null;
  cost_per_unit: number;
  currency: string;
  source: 'manual' | 'csv_import' | 'shopify_sync';
  created_at: string;
  updated_at: string;
}

export interface OrderLineItem {
  shopify_product_id: string;
  shopify_variant_id?: string;
  sku?: string;
  title: string;
  variant_title?: string;
  quantity: number;
  price: number;
}

export interface ProfitSummary {
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  totalAdSpend: number;
  netProfit: number;
  grossMarginPercent: number;
  trueRoas: number;
  orderCount: number;
}

export interface ProductProfitability {
  productId: string;
  productTitle: string;
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  unitsSold: number;
  avgMargin: number;
}

/**
 * Create Supabase client for profit operations
 */
function getSupabaseClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Get cost per unit for a product
 */
export async function getProductCost(
  storeId: string,
  productId: string,
  variantId?: string
): Promise<number> {
  const supabase = getSupabaseClient();

  // Try variant-specific cost first
  if (variantId) {
    const { data: variantCost } = await supabase
      .from('product_costs')
      .select('cost_per_unit')
      .eq('store_id', storeId)
      .eq('shopify_product_id', productId)
      .eq('shopify_variant_id', variantId)
      .single();

    if (variantCost) {
      return parseFloat(variantCost.cost_per_unit) || 0;
    }
  }

  // Fall back to product-level cost
  const { data: productCost } = await supabase
    .from('product_costs')
    .select('cost_per_unit')
    .eq('store_id', storeId)
    .eq('shopify_product_id', productId)
    .is('shopify_variant_id', null)
    .single();

  return productCost ? parseFloat(productCost.cost_per_unit) || 0 : 0;
}

/**
 * Calculate COGS for order line items
 */
export async function calculateOrderCogs(
  storeId: string,
  lineItems: OrderLineItem[]
): Promise<{ totalCogs: number; itemCosts: Array<{ item: OrderLineItem; cost: number; totalCost: number }> }> {
  const supabase = getSupabaseClient();

  // Batch fetch all product costs for efficiency
  const productIds = [...new Set(lineItems.map(item => item.shopify_product_id))];

  const { data: costs } = await supabase
    .from('product_costs')
    .select('*')
    .eq('store_id', storeId)
    .in('shopify_product_id', productIds);

  const costMap = new Map<string, number>();

  // Build cost lookup map
  if (costs) {
    for (const cost of costs) {
      const key = cost.shopify_variant_id
        ? `${cost.shopify_product_id}:${cost.shopify_variant_id}`
        : cost.shopify_product_id;
      costMap.set(key, parseFloat(cost.cost_per_unit) || 0);
    }
  }

  // Calculate costs for each line item
  const itemCosts = lineItems.map(item => {
    // Try variant-specific cost first
    let cost = 0;
    if (item.shopify_variant_id) {
      cost = costMap.get(`${item.shopify_product_id}:${item.shopify_variant_id}`) || 0;
    }
    // Fall back to product-level
    if (cost === 0) {
      cost = costMap.get(item.shopify_product_id) || 0;
    }

    return {
      item,
      cost,
      totalCost: cost * item.quantity
    };
  });

  const totalCogs = itemCosts.reduce((sum, ic) => sum + ic.totalCost, 0);

  return { totalCogs, itemCosts };
}

/**
 * Get profit summary for a store
 */
export async function getProfitSummary(
  storeId: string,
  startDate?: Date,
  endDate?: Date
): Promise<ProfitSummary> {
  const supabase = getSupabaseClient();

  // Get order totals
  let ordersQuery = supabase
    .from('adwyse_orders')
    .select('total_price, cogs')
    .eq('store_id', storeId);

  if (startDate) {
    ordersQuery = ordersQuery.gte('order_created_at', startDate.toISOString());
  }
  if (endDate) {
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    ordersQuery = ordersQuery.lte('order_created_at', endOfDay.toISOString());
  }

  const { data: orders } = await ordersQuery;

  // Get ad spend
  let campaignsQuery = supabase
    .from('adwyse_campaigns')
    .select('spend')
    .eq('store_id', storeId);

  if (startDate) {
    campaignsQuery = campaignsQuery.gte('date', startDate.toISOString().split('T')[0]);
  }
  if (endDate) {
    campaignsQuery = campaignsQuery.lte('date', endDate.toISOString().split('T')[0]);
  }

  const { data: campaigns } = await campaignsQuery;

  // Calculate metrics
  const totalRevenue = orders?.reduce((sum, o) => sum + parseFloat(o.total_price || '0'), 0) || 0;
  const totalCogs = orders?.reduce((sum, o) => sum + parseFloat(o.cogs || '0'), 0) || 0;
  const totalAdSpend = campaigns?.reduce((sum, c) => sum + parseFloat(c.spend || '0'), 0) || 0;

  const grossProfit = totalRevenue - totalCogs;
  const netProfit = grossProfit - totalAdSpend;

  return {
    totalRevenue,
    totalCogs,
    grossProfit,
    totalAdSpend,
    netProfit,
    grossMarginPercent: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
    trueRoas: totalAdSpend > 0 ? netProfit / totalAdSpend : 0,
    orderCount: orders?.length || 0
  };
}

/**
 * Get product-level profitability
 */
export async function getProductProfitability(
  storeId: string,
  startDate?: Date,
  endDate?: Date,
  limit: number = 20
): Promise<ProductProfitability[]> {
  const supabase = getSupabaseClient();

  // Get line items with costs
  let query = supabase
    .from('adwyse_order_line_items')
    .select(`
      shopify_product_id,
      title,
      quantity,
      unit_price,
      unit_cost,
      line_total,
      line_cogs,
      adwyse_orders!inner(store_id, order_created_at)
    `)
    .eq('adwyse_orders.store_id', storeId);

  if (startDate) {
    query = query.gte('adwyse_orders.order_created_at', startDate.toISOString());
  }
  if (endDate) {
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    query = query.lte('adwyse_orders.order_created_at', endOfDay.toISOString());
  }

  const { data: lineItems } = await query;

  if (!lineItems || lineItems.length === 0) {
    return [];
  }

  // Aggregate by product
  const productMap = new Map<string, ProductProfitability>();

  for (const item of lineItems) {
    const existing = productMap.get(item.shopify_product_id);
    const revenue = parseFloat(item.line_total || '0');
    const cogs = parseFloat(item.line_cogs || '0');
    const quantity = item.quantity || 0;

    if (existing) {
      existing.totalRevenue += revenue;
      existing.totalCogs += cogs;
      existing.grossProfit += (revenue - cogs);
      existing.unitsSold += quantity;
    } else {
      productMap.set(item.shopify_product_id, {
        productId: item.shopify_product_id,
        productTitle: item.title || 'Unknown Product',
        totalRevenue: revenue,
        totalCogs: cogs,
        grossProfit: revenue - cogs,
        unitsSold: quantity,
        avgMargin: 0
      });
    }
  }

  // Calculate average margins and sort
  const products = Array.from(productMap.values()).map(p => ({
    ...p,
    avgMargin: p.totalRevenue > 0 ? (p.grossProfit / p.totalRevenue) * 100 : 0
  }));

  // Sort by gross profit descending
  products.sort((a, b) => b.grossProfit - a.grossProfit);

  return products.slice(0, limit);
}

/**
 * Upsert product cost
 */
export async function upsertProductCost(
  storeId: string,
  productId: string,
  variantId: string | null,
  costPerUnit: number,
  metadata?: {
    sku?: string;
    productTitle?: string;
    variantTitle?: string;
    source?: 'manual' | 'csv_import' | 'shopify_sync';
  }
): Promise<ProductCost | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('product_costs')
    .upsert({
      store_id: storeId,
      shopify_product_id: productId,
      shopify_variant_id: variantId,
      cost_per_unit: costPerUnit,
      sku: metadata?.sku || null,
      product_title: metadata?.productTitle || null,
      variant_title: metadata?.variantTitle || null,
      source: metadata?.source || 'manual',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'store_id,shopify_product_id,COALESCE(shopify_variant_id,\'\')'
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting product cost:', error);
    return null;
  }

  return data;
}

/**
 * Bulk import product costs from CSV data
 */
export async function bulkImportProductCosts(
  storeId: string,
  costs: Array<{
    productId: string;
    variantId?: string;
    sku?: string;
    productTitle?: string;
    variantTitle?: string;
    costPerUnit: number;
  }>
): Promise<{ imported: number; errors: string[] }> {
  const supabase = getSupabaseClient();
  const errors: string[] = [];
  let imported = 0;

  // Process in batches of 100
  const batchSize = 100;
  for (let i = 0; i < costs.length; i += batchSize) {
    const batch = costs.slice(i, i + batchSize);

    const records = batch.map(cost => ({
      store_id: storeId,
      shopify_product_id: cost.productId,
      shopify_variant_id: cost.variantId || null,
      sku: cost.sku || null,
      product_title: cost.productTitle || null,
      variant_title: cost.variantTitle || null,
      cost_per_unit: cost.costPerUnit,
      source: 'csv_import' as const,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('product_costs')
      .upsert(records, {
        onConflict: 'store_id,shopify_product_id,COALESCE(shopify_variant_id,\'\')'
      });

    if (error) {
      errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
    } else {
      imported += batch.length;
    }
  }

  return { imported, errors };
}

/**
 * Sync product costs from Shopify inventory
 */
export async function syncShopifyInventoryCosts(
  storeId: string,
  accessToken: string,
  shopDomain: string
): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;

  try {
    // Fetch products with inventory data from Shopify
    const response = await fetch(
      `https://${shopDomain}/admin/api/2024-01/products.json?fields=id,title,variants&limit=250`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status}`);
    }

    const { products } = await response.json();

    // Extract variant costs (Shopify stores cost in inventory_item)
    const costsToImport: Array<{
      productId: string;
      variantId: string;
      sku?: string;
      productTitle: string;
      variantTitle?: string;
      costPerUnit: number;
    }> = [];

    for (const product of products) {
      for (const variant of product.variants || []) {
        // Note: Shopify's cost field requires inventory_item access
        // This is a simplified version - full implementation needs inventory_item API
        if (variant.price) {
          costsToImport.push({
            productId: product.id.toString(),
            variantId: variant.id.toString(),
            sku: variant.sku,
            productTitle: product.title,
            variantTitle: variant.title !== 'Default Title' ? variant.title : undefined,
            // Default to 30% of price as estimated cost if no cost data
            costPerUnit: parseFloat(variant.price) * 0.3
          });
        }
      }
    }

    if (costsToImport.length > 0) {
      const result = await bulkImportProductCosts(storeId, costsToImport.map(c => ({
        ...c,
      })));
      synced = result.imported;
      errors.push(...result.errors);
    }

  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return { synced, errors };
}
