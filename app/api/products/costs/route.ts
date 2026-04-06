import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { upsertProductCost } from '@/lib/profit-calculations';

/**
 * Product Costs CRUD API
 * Manages cost of goods sold (COGS) for products
 */

// GET - List product costs for a store
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const productId = searchParams.get('productId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let query = supabase
      .from('product_costs')
      .select('*', { count: 'exact' })
      .eq('store_id', storeId)
      .order('updated_at', { ascending: false });

    if (productId) {
      query = query.eq('shopify_product_id', productId);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching product costs:', error);
      return NextResponse.json({ error: 'Failed to fetch product costs' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      costs: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Product costs GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create or update a product cost
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      storeId,
      productId,
      variantId,
      costPerUnit,
      sku,
      productTitle,
      variantTitle
    } = body;

    if (!storeId || !productId || costPerUnit === undefined) {
      return NextResponse.json({
        error: 'storeId, productId, and costPerUnit are required'
      }, { status: 400 });
    }

    if (typeof costPerUnit !== 'number' || costPerUnit < 0) {
      return NextResponse.json({
        error: 'costPerUnit must be a non-negative number'
      }, { status: 400 });
    }

    const result = await upsertProductCost(storeId, productId, variantId || null, costPerUnit, {
      sku,
      productTitle,
      variantTitle,
      source: 'manual'
    });

    if (!result) {
      return NextResponse.json({ error: 'Failed to save product cost' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      cost: result
    });

  } catch (error) {
    console.error('Product costs POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Bulk update product costs
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, costs } = body;

    if (!storeId || !Array.isArray(costs)) {
      return NextResponse.json({
        error: 'storeId and costs array are required'
      }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const records = costs.map(cost => ({
      store_id: storeId,
      shopify_product_id: cost.productId,
      shopify_variant_id: cost.variantId || null,
      cost_per_unit: cost.costPerUnit,
      sku: cost.sku || null,
      product_title: cost.productTitle || null,
      variant_title: cost.variantTitle || null,
      source: 'manual',
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('product_costs')
      .upsert(records, {
        onConflict: 'store_id,shopify_product_id,COALESCE(shopify_variant_id,\'\')'
      });

    if (error) {
      console.error('Error bulk updating product costs:', error);
      return NextResponse.json({ error: 'Failed to update product costs' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      updated: costs.length
    });

  } catch (error) {
    console.error('Product costs PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a product cost
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const costId = searchParams.get('id');
    const storeId = searchParams.get('storeId');

    if (!costId || !storeId) {
      return NextResponse.json({
        error: 'id and storeId are required'
      }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error } = await supabase
      .from('product_costs')
      .delete()
      .eq('id', costId)
      .eq('store_id', storeId);

    if (error) {
      console.error('Error deleting product cost:', error);
      return NextResponse.json({ error: 'Failed to delete product cost' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Product costs DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
