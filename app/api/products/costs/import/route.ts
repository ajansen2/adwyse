import { NextRequest, NextResponse } from 'next/server';
import { bulkImportProductCosts, syncShopifyInventoryCosts } from '@/lib/profit-calculations';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedShop } from '@/lib/verify-session';

/**
 * Product Costs Import API
 * Handles CSV import and Shopify sync for COGS data
 */

interface CSVCostRow {
  product_id?: string;
  productId?: string;
  variant_id?: string;
  variantId?: string;
  sku?: string;
  product_title?: string;
  productTitle?: string;
  variant_title?: string;
  variantTitle?: string;
  cost?: string | number;
  cost_per_unit?: string | number;
  costPerUnit?: string | number;
}

// POST - Import product costs from CSV or sync from Shopify
export async function POST(request: NextRequest) {
  const shop = getAuthenticatedShop(request);
  if (!shop) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const contentType = request.headers.get('content-type') || '';

    // Handle JSON request (Shopify sync or structured import)
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { storeId, action, costs } = body;

      if (!storeId) {
        return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
      }

      // Shopify inventory sync
      if (action === 'shopify_sync') {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { data: store } = await supabase
          .from('adwyse_stores')
          .select('access_token, shop_domain')
          .eq('id', storeId)
          .single();

        if (!store?.access_token || !store?.shop_domain) {
          return NextResponse.json({
            error: 'Store not found or not connected to Shopify'
          }, { status: 400 });
        }

        const result = await syncShopifyInventoryCosts(
          storeId,
          store.access_token,
          store.shop_domain
        );

        return NextResponse.json({
          success: true,
          synced: result.synced,
          errors: result.errors
        });
      }

      // Structured JSON import
      if (costs && Array.isArray(costs)) {
        const result = await bulkImportProductCosts(storeId, costs);
        return NextResponse.json({
          success: true,
          imported: result.imported,
          errors: result.errors
        });
      }

      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Handle CSV file upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const storeId = formData.get('storeId') as string;

      if (!file || !storeId) {
        return NextResponse.json({
          error: 'File and storeId are required'
        }, { status: 400 });
      }

      // Parse CSV
      const csvText = await file.text();
      const rows = parseCSV(csvText);

      if (rows.length === 0) {
        return NextResponse.json({
          error: 'No valid data found in CSV'
        }, { status: 400 });
      }

      // Convert CSV rows to cost records
      const costs = rows.map(row => ({
        productId: row.product_id || row.productId || '',
        variantId: row.variant_id || row.variantId,
        sku: row.sku,
        productTitle: row.product_title || row.productTitle,
        variantTitle: row.variant_title || row.variantTitle,
        costPerUnit: parseFloat(String(row.cost || row.cost_per_unit || row.costPerUnit || 0))
      })).filter(c => c.productId && !isNaN(c.costPerUnit));

      if (costs.length === 0) {
        return NextResponse.json({
          error: 'No valid cost data found. Ensure CSV has product_id and cost columns.'
        }, { status: 400 });
      }

      const result = await bulkImportProductCosts(storeId, costs);

      return NextResponse.json({
        success: true,
        imported: result.imported,
        total: rows.length,
        errors: result.errors
      });
    }

    return NextResponse.json({
      error: 'Unsupported content type. Use application/json or multipart/form-data'
    }, { status: 400 });

  } catch (error) {
    console.error('Product costs import error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Simple CSV parser that handles quoted fields and common edge cases
 */
function parseCSV(csvText: string): CSVCostRow[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim());

  if (lines.length < 2) {
    return [];
  }

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h =>
    h.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  );

  // Parse data rows
  const rows: CSVCostRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length && j < values.length; j++) {
      row[headers[j]] = values[j];
    }
    rows.push(row as CSVCostRow);
  }

  return rows;
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

// GET - Get CSV template
export async function GET() {
  const template = `product_id,variant_id,sku,product_title,variant_title,cost_per_unit
123456789,987654321,SKU-001,Sample Product,Size: Large,15.99
123456789,,SKU-002,Sample Product,,12.50
234567890,,SKU-003,Another Product,,8.25`;

  return new NextResponse(template, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=product_costs_template.csv'
    }
  });
}
