/**
 * Database Connection Utilities
 * Provides functions to validate and test Supabase database connections
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Get Supabase configuration from environment variables
 */
export function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isConfigured = 
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseAnonKey !== 'placeholder-key';

  return {
    url: supabaseUrl || 'https://placeholder.supabase.co',
    anonKey: supabaseAnonKey || 'placeholder-key',
    isConfigured,
  };
}

/**
 * Create a Supabase client with validation
 */
export function createSupabaseClient(options?: {
  persistSession?: boolean;
  autoRefreshToken?: boolean;
}) {
  const config = getSupabaseConfig();

  if (!config.isConfigured && typeof window !== 'undefined') {
    console.error('⚠️ Supabase is not configured properly!');
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file');
  }

  const client = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: options?.persistSession ?? (typeof window !== 'undefined'),
      autoRefreshToken: options?.autoRefreshToken ?? (typeof window !== 'undefined'),
      detectSessionInUrl: typeof window !== 'undefined',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  });

  return { client, config };
}

/**
 * Test database connection by querying a simple table
 */
export async function testConnection(tableName: string = 'interactions'): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> {
  try {
    const { client, config } = createSupabaseClient({
      persistSession: false,
      autoRefreshToken: false,
    });

    if (!config.isConfigured) {
      return {
        success: false,
        error: 'NOT_CONFIGURED',
        message: 'Supabase environment variables are not configured',
      };
    }

    // Try to query the table with a limit of 1 to test connection
    const result = await Promise.race([
      client
        .from(tableName)
        .select('id')
        .limit(1),
      new Promise<{ data: null; error: { message: string } }>((_, reject) =>
        setTimeout(() => reject({ data: null, error: { message: 'Connection timeout after 5 seconds' } }), 5000)
      ),
    ]) as { data: unknown[] | null; error: { message?: string; code?: string; details?: string; hint?: string } | null };
    
    const { error } = result;

    if (error) {
      // Check for common connection errors
      if (error.message?.includes('JWT') || error.message?.includes('token')) {
        return {
          success: false,
          error: 'AUTH_ERROR',
          message: `Authentication error: ${error.message}. Please check your Supabase keys.`,
        };
      }
      
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return {
          success: false,
          error: 'TABLE_NOT_FOUND',
          message: `Table "${tableName}" does not exist. Please run the database migration.`,
        };
      }

      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'RLS_ERROR',
          message: `Row Level Security (RLS) is blocking access to "${tableName}". Please check RLS policies.`,
        };
      }

      return {
        success: false,
        error: 'QUERY_ERROR',
        message: `Database query failed: ${error.message}`,
      };
    }

    return {
      success: true,
      message: 'Database connection successful',
    };
  } catch (err) {
    // Handle timeout errors from Promise.race
    const error = err as { error?: { message?: string } } | Error;
    
    if (error && typeof error === 'object' && 'error' in error) {
      if (error.error?.message?.includes('timeout')) {
        return {
          success: false,
          error: 'TIMEOUT',
          message: 'Database connection timed out. Please check your network connection and Supabase project status.',
        };
      }
    }

    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred while testing connection';

    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      message: errorMessage,
    };
  }
}

/**
 * Validate Supabase configuration on the client side
 */
export function validateClientConfiguration(): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const config = getSupabaseConfig();

  if (!config.isConfigured) {
    issues.push('NEXT_PUBLIC_SUPABASE_URL is not set or is placeholder');
    issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or is placeholder');
  } else {
    // Validate URL format
    try {
      new URL(config.url);
      if (!config.url.includes('supabase.co')) {
        issues.push('NEXT_PUBLIC_SUPABASE_URL does not appear to be a valid Supabase URL');
      }
    } catch {
      issues.push('NEXT_PUBLIC_SUPABASE_URL is not a valid URL');
    }

    // Validate key format (should be a JWT-like string)
    if (config.anonKey.length < 100) {
      issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)');
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

