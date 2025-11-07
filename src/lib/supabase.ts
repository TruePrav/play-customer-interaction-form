import { createSupabaseClient, validateClientConfiguration } from './dbConnection'

// Validate configuration on client side
if (typeof window !== 'undefined') {
  const validation = validateClientConfiguration();
  if (!validation.isValid) {
    console.error('⚠️ Supabase Configuration Issues:');
    validation.issues.forEach(issue => {
      console.error(`  - ${issue}`);
    });
    console.error('\nPlease check your .env.local file and ensure:');
    console.error('  1. NEXT_PUBLIC_SUPABASE_URL is set to your Supabase project URL');
    console.error('  2. NEXT_PUBLIC_SUPABASE_ANON_KEY is set to your Supabase anon/public key');
    console.error('  3. Both values are correct (you can find them in Supabase Dashboard > Settings > API)');
  }
}

// Create the client-side Supabase client
const { client: supabase } = createSupabaseClient({
  persistSession: true,
  autoRefreshToken: true,
})

export { supabase }
export { validateClientConfiguration, testConnection, getSupabaseConfig } from './dbConnection'
