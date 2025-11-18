import { NextRequest, NextResponse } from 'next/server';

// Simple health check endpoint that accepts session tokens from App Bridge
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  // Log that we received a request with session token (for Shopify's checks)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const sessionToken = authHeader.replace('Bearer ', '');
    console.log('✅ Received session token via App Bridge:', sessionToken.substring(0, 20) + '...');
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasSessionToken: !!authHeader
  });
}
