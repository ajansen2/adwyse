import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, company } = await request.json();

    console.log('Signup request received:', { email, fullName, company });

    // Create Supabase client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 1. Create auth user
    const { data: authData, error: signupError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for now
      user_metadata: {
        full_name: fullName,
        company: company
      }
    });

    if (signupError) {
      console.error('Auth user creation error:', signupError);
      return NextResponse.json({ error: signupError.message }, { status: 400 });
    }

    if (!authData.user) {
      console.error('No user data returned from createUser');
      return NextResponse.json({ error: 'User creation failed' }, { status: 500 });
    }

    console.log('Auth user created successfully:', authData.user.id);

    // 2. Create merchant profile (using service role to bypass RLS)
    const { error: profileError } = await supabaseAdmin
      .from('merchants')
      .insert({
        user_id: authData.user.id,
        email: email,
        full_name: fullName,
        company: company,
        subscription_tier: 'trial',
        onboarding_step: 'welcome'
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Clean up: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: 'Account setup failed' }, { status: 500 });
    }

    console.log('Merchant profile created successfully');

    // 3. Sign in the user
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: sessionData, error: sessionError } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (sessionError) {
      console.error('Sign-in error:', sessionError);
      return NextResponse.json({ error: sessionError.message }, { status: 400 });
    }

    console.log('User signed in successfully');

    return NextResponse.json({
      success: true,
      session: sessionData.session
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
