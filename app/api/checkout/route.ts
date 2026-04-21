// app/api/checkout/route.ts
// Stripe billing is not used — AdWyse uses Shopify App Billing exclusively.
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is not used. Billing is handled through Shopify App Billing.' },
    { status: 410 }
  );
}
