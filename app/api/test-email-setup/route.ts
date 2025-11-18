import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';

export async function GET() {
  const results: {
    timestamp: string;
    checks: Record<string, unknown>;
    overall?: string;
    error?: string;
  } = {
    timestamp: new Date().toISOString(),
    checks: {},
  };

  try {
    // 1. Check environment variables
    results.checks.env = {
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    // 2. Test Supabase connection
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: cart, error } = await supabase
        .from('abandoned_carts')
        .select('*')
        .limit(1)
        .single();

      results.checks.supabase = {
        connected: !error,
        hasCart: !!cart,
        cartId: cart?.id || null,
        error: error?.message || null,
      };
    } catch (e) {
      results.checks.supabase = {
        connected: false,
        error: e instanceof Error ? e.message : 'Unknown error',
      };
    }

    // 3. Test Anthropic API
    try {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const message = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: 'Say "test successful" as JSON: {"status": "ok"}',
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

      results.checks.anthropic = {
        connected: true,
        response: responseText.substring(0, 100),
        model: 'claude-3-5-haiku-20241022',
      };
    } catch (e) {
      results.checks.anthropic = {
        connected: false,
        error: e instanceof Error ? e.message : 'Unknown error',
        statusCode: typeof e === 'object' && e !== null && 'status' in e ? (e as { status: number }).status : undefined,
      };
    }

    // 4. Test Resend API (don't actually send)
    try {
      new Resend(process.env.RESEND_API_KEY);

      results.checks.resend = {
        initialized: true,
        note: 'Not sending test email to avoid spam',
      };
    } catch (e) {
      results.checks.resend = {
        initialized: false,
        error: e instanceof Error ? e.message : 'Unknown error',
      };
    }

    results.overall = 'Diagnostics complete';

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    results.overall = 'Failed';
    results.error = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(results, { status: 500 });
  }
}
