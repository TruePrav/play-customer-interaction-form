import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Validate configuration
if (typeof window !== 'undefined') {
  if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
    console.error('⚠️ NEXT_PUBLIC_SUPABASE_URL is not set or is placeholder');
  }
  if (!supabaseAnonKey || supabaseAnonKey === 'placeholder-key') {
    console.error('⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or is placeholder');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
})
