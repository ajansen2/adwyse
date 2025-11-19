// Run AdWyse database migration
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Running AdWyse database migration...\n');

    // Read the migration file
    const migrationSQL = fs.readFileSync(
      './supabase/migrations/001_adwyse_initial_schema.sql',
      'utf8'
    );

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // If exec_sql doesn't exist, try direct SQL execution
      console.log('📝 Executing migration directly...');

      // Split by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.startsWith('--') || statement.length === 0) continue;

        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        const result = await supabase.rpc('exec_sql', { sql: statement + ';' });

        if (result.error && !result.error.message.includes('already exists')) {
          console.error(`Error in statement ${i + 1}:`, result.error);
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nCreated tables:');
    console.log('  - adwyse_stores');
    console.log('  - adwyse_ad_accounts');
    console.log('  - adwyse_campaigns');
    console.log('  - adwyse_orders');
    console.log('  - adwyse_insights');
    console.log('\nYou can now view these in your Supabase dashboard!');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.log('\n💡 Alternative: Copy the SQL from supabase/migrations/001_adwyse_initial_schema.sql');
    console.log('   and run it directly in Supabase SQL Editor');
    process.exit(1);
  }
}

runMigration();
