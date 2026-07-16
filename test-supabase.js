import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zgixofpjvscxiwoqthdd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnaXhvZnBqdnNjeGl3b3F0aGRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzMwOTksImV4cCI6MjA5ODc0OTA5OX0.yavXrroGtPwIqEfD247JYxElqcYa3dl_YxLSphRklCs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  // Test 1: Check if we can query establishments
  const { data: establishments, error: estError } = await supabase
    .from('establishments')
    .select('*')
    .limit(1);
  
  if (estError) {
    console.log('❌ Error fetching establishments:', estError.message);
  } else {
    console.log('✅ Connected! Found', establishments?.length || 0, 'establishments');
  }

  // Test 2: Check auth status
  const { data: { session } } = await supabase.auth.getSession();
  console.log('🔐 Auth session:', session ? 'Active' : 'None');
}

testConnection();