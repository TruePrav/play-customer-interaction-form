"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { interactionSchema, type InteractionFormSchema } from "@/lib/validation";
import { supabase } from "@/lib/supabase";

// LocalStorage keys for caching form options
const STORAGE_KEYS = {
  channels: 'form_options_channels',
  branches: 'form_options_branches',
  categories: 'form_options_categories',
  staff: 'form_options_staff',
  lastUpdated: 'form_options_last_updated', // Timestamp of last successful fetch
} as const;

// Helper functions for localStorage
const saveToStorage = (key: string, data: string[]) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
      // Update timestamp when we save any data
      localStorage.setItem(STORAGE_KEYS.lastUpdated, Date.now().toString());
    }
  } catch (error) {
    console.warn(`Failed to save to localStorage (${key}):`, error);
  }
};

const loadFromStorage = (key: string): string[] | null => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as string[];
      }
    }
  } catch (error) {
    console.warn(`Failed to load from localStorage (${key}):`, error);
  }
  return null;
};

const getLastUpdated = (): number | null => {
  try {
    if (typeof window !== 'undefined') {
      const timestamp = localStorage.getItem(STORAGE_KEYS.lastUpdated);
      return timestamp ? parseInt(timestamp, 10) : null;
    }
  } catch (error) {
    console.warn('Failed to get last updated timestamp:', error);
  }
  return null;
};

export default function InteractionsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize state - start with empty arrays to avoid hydration mismatch
  // localStorage is only available on client, so we'll load from cache in useEffect
  const [channels, setChannels] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [staffMembers, setStaffMembers] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const firstFieldRef = useRef<HTMLDivElement>(null);
  
  // Load from localStorage on client side only (after mount)
  useEffect(() => {
    // Load cached data from localStorage on client
    const cachedChannels = loadFromStorage(STORAGE_KEYS.channels) || [];
    const cachedBranches = loadFromStorage(STORAGE_KEYS.branches) || [];
    const cachedCategories = loadFromStorage(STORAGE_KEYS.categories) || [];
    const cachedStaff = loadFromStorage(STORAGE_KEYS.staff) || [];
    
    if (cachedChannels.length > 0 || cachedBranches.length > 0 || 
        cachedCategories.length > 0 || cachedStaff.length > 0) {
      console.log('✅ Loading cached form options from localStorage');
      setChannels(cachedChannels);
      setBranches(cachedBranches);
      setCategories(cachedCategories);
      setStaffMembers(cachedStaff);
      setLoadingOptions(false);
    }
  }, []); // Run once on mount

  useEffect(() => {
    // Debug Supabase connection on mount
    const debugSupabaseConnection = async () => {
      console.log('=== SUPABASE CONNECTION DEBUG ===');
      
      // Check environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      console.log('📋 Environment Variables:');
      console.log('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ NOT SET');
      console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : '❌ NOT SET');
      
      if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
        console.error('❌ Supabase URL is not configured or is placeholder!');
        return;
      }
      
      if (!supabaseKey || supabaseKey === 'placeholder-key') {
        console.error('❌ Supabase Anon Key is not configured or is placeholder!');
        return;
      }
      
      // Check Supabase client
      console.log('📦 Supabase Client:');
      console.log('  Client exists:', !!supabase);
      if (supabase) {
        console.log('  Client URL:', (supabase as any).supabaseUrl || 'N/A');
        console.log('  Client Key:', (supabase as any).supabaseKey ? `${(supabase as any).supabaseKey.substring(0, 20)}...` : 'N/A');
      }
      
      // Check session/authentication
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('🔐 Session Status:');
        console.log('  Has session:', !!sessionData?.session);
        console.log('  User:', sessionData?.session?.user?.email || 'None');
        console.log('  Session error:', sessionError || 'None');
      } catch (err) {
        console.error('  ❌ Error checking session:', err);
      }
      
      // Test basic connectivity with a simple query (with timeout)
      console.log('🌐 Testing Database Connectivity:');
      try {
        const testStart = Date.now();
        
        // Add timeout to connectivity test
        const testTimeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Connectivity test timeout after 10s')), 10000);
        });
        
        const testQuery = supabase
          .from('staff_members')
          .select('id')
          .limit(1);
        
        const { data, error, status, statusText } = await Promise.race([
          testQuery,
          testTimeout
        ]) as Awaited<typeof testQuery>;
        
        const testDuration = Date.now() - testStart;
        
        console.log('  Query duration:', `${testDuration}ms`);
        console.log('  HTTP status:', status, statusText);
        console.log('  Has data:', !!data);
        console.log('  Data length:', data?.length || 0);
        console.log('  Error:', error || 'None');
        
        if (error) {
          console.error('  ❌ Query failed:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          console.error('  💡 Check RLS policies on staff_members table');
        } else {
          console.log('  ✅ Database connection successful!');
        }
      } catch (err) {
        const testDuration = Date.now() - Date.now(); // This will be wrong but we're in catch
        console.error('  ❌ Exception during connectivity test:', err);
        if (err instanceof Error) {
          console.error('  Error message:', err.message);
          if (err.message.includes('timeout')) {
            console.error('  ⚠️ Query is hanging - check Network tab in browser');
            console.error('  💡 Possible causes:');
            console.error('     - Network connectivity issue');
            console.error('     - CORS blocking requests');
            console.error('     - Supabase project paused (free tier)');
            console.error('     - Firewall/proxy blocking requests');
          }
        }
      }
      
      console.log('=== END DEBUG ===');
    };
    
    // Debug connection first
    debugSupabaseConnection();
    
    // Fetch from database in background to update cache
    let isMounted = true;
    
    const fetchFromDatabase = async (attempt = 0) => {
      try {
        // Progressive delay - production may need more time
        const delays = [200, 500, 1000];
        const delay = attempt < delays.length ? delays[attempt] : 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        if (!isMounted) return;
        
        // Check if we have cached data now (after localStorage load)
        const hasCachedData = 
          channels.length > 0 || 
          branches.length > 0 || 
          categories.length > 0 || 
          staffMembers.length > 0;
        
        // Verify Supabase client is configured
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
          console.error('⚠️ Supabase URL not configured!');
          if (!hasCachedData) {
            setLoadingOptions(false);
          }
          return;
        }
        
        // Verify Supabase client is available (it should always be, but check anyway)
        if (!supabase) {
          console.error('❌ Supabase client not available');
          if (attempt < 2) {
            setTimeout(() => fetchFromDatabase(attempt + 1), delay);
            return;
          }
          if (!hasCachedData) {
            setLoadingOptions(false);
          }
          return;
        }
        
        console.log(`🔄 Attempting to fetch form options (attempt ${attempt + 1})...`);
        
        // Fetch from database (only show loading if we don't have cached data)
        if (!hasCachedData) {
          setLoadingOptions(true);
        }
        await fetchFormOptions();
      } catch (err) {
        console.error('❌ Error fetching form options from database:', err);
        if (err instanceof Error) {
          console.error('  Error message:', err.message);
          console.error('  Error stack:', err.stack);
        }
        // Retry once more if this was the first attempt
        if (attempt < 1 && isMounted) {
          console.log('🔄 Retrying fetch after error...');
          setTimeout(() => fetchFromDatabase(attempt + 1), 1000);
          return;
        }
        // Set loading to false on error after retries
        // Check current state to see if we have cached data
        if (isMounted) {
          const hasCachedData = 
            channels.length > 0 || 
            branches.length > 0 || 
            categories.length > 0 || 
            staffMembers.length > 0;
          if (!hasCachedData) {
            setLoadingOptions(false);
          }
        }
      }
    };

    fetchFromDatabase();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if database has changed by comparing with cached data
  const checkAndUpdateFormOptions = async (silent = false): Promise<boolean> => {
    // If silent mode, don't show loading state unless data actually changed
    if (!silent) {
      setLoadingOptions(true);
    }
    
    try {
      console.log('🔍 Checking for form option updates...');
      const checkStart = Date.now();
      
      // Use a timeout to prevent hanging - 10 seconds max
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          console.warn('⏱️ Update check timeout after 10 seconds');
          reject(new Error('Update check timeout'));
        }, 10000);
      });
      
      // Fetch from database with timeout
      console.log('📡 Fetching form options from database...');
      const fetchPromise = Promise.all([
        supabase.from('staff_members').select('name').eq('active', true).order('display_order'),
        supabase.from('channels').select('name').eq('active', true).order('display_order'),
        supabase.from('branches').select('name').eq('active', true).order('display_order'),
        supabase.from('categories').select('name').eq('active', true).order('display_order'),
      ]);
      
      const results = await Promise.race([fetchPromise, timeoutPromise]);
      const checkDuration = Date.now() - checkStart;
      console.log(`✅ All queries completed in ${checkDuration}ms`);
      
      const [staffResult, channelResult, branchResult, categoryResult] = results as Awaited<typeof fetchPromise>;
      
      // Debug each result
      console.log('📊 Query Results:');
      console.log('  staff_members:', {
        hasData: !!staffResult.data,
        dataLength: staffResult.data?.length || 0,
        hasError: !!staffResult.error,
        error: staffResult.error?.message || 'None',
      });
      console.log('  channels:', {
        hasData: !!channelResult.data,
        dataLength: channelResult.data?.length || 0,
        hasError: !!channelResult.error,
        error: channelResult.error?.message || 'None',
      });
      console.log('  branches:', {
        hasData: !!branchResult.data,
        dataLength: branchResult.data?.length || 0,
        hasError: !!branchResult.error,
        error: branchResult.error?.message || 'None',
      });
      console.log('  categories:', {
        hasData: !!categoryResult.data,
        dataLength: categoryResult.data?.length || 0,
        hasError: !!categoryResult.error,
        error: categoryResult.error?.message || 'None',
      });
      
      // Check if any queries failed
      if (staffResult.error || channelResult.error || branchResult.error || categoryResult.error) {
        console.warn('Some queries failed during update check:', {
          staff: staffResult.error?.message,
          channels: channelResult.error?.message,
          branches: branchResult.error?.message,
          categories: categoryResult.error?.message,
        });
        return false;
      }
      
      // Extract data
      const staffData = staffResult.data?.map(s => s.name) || [];
      const channelData = channelResult.data?.map(c => c.name) || [];
      const branchData = branchResult.data?.map(b => b.name) || [];
      const categoryData = categoryResult.data?.map(c => c.name) || [];
      
      // Check if data has changed by comparing with current state
      const hasChanged = 
        JSON.stringify(staffData) !== JSON.stringify(staffMembers) ||
        JSON.stringify(channelData) !== JSON.stringify(channels) ||
        JSON.stringify(branchData) !== JSON.stringify(branches) ||
        JSON.stringify(categoryData) !== JSON.stringify(categories);
      
      if (hasChanged) {
        console.log('Form options changed in database, updating...');
        // Update state and localStorage
        if (staffData.length > 0) {
          setStaffMembers(staffData);
          saveToStorage(STORAGE_KEYS.staff, staffData);
        }
        if (channelData.length > 0) {
          setChannels(channelData);
          saveToStorage(STORAGE_KEYS.channels, channelData);
        }
        if (branchData.length > 0) {
          setBranches(branchData);
          saveToStorage(STORAGE_KEYS.branches, branchData);
        }
        if (categoryData.length > 0) {
          setCategories(categoryData);
          saveToStorage(STORAGE_KEYS.categories, categoryData);
        }
        return true; // Data was updated
      } else {
        if (!silent) {
          console.log('Form options unchanged, using cached data');
        }
        return false; // No changes
      }
    } catch (err) {
      // Silently handle errors in silent mode (background checks)
      if (!silent) {
        console.error('Error checking form options:', err);
      }
      return false;
    } finally {
      if (!silent) {
        setLoadingOptions(false);
      }
    }
  };

  const fetchFormOptions = async (retryCount = 0) => {
    setLoadingOptions(true);
    
    let hasAnySuccess = false;
    let hasNetworkError = false;

    // Helper to fetch with retry logic for individual queries
    const fetchWithRetry = async <T extends { name: string }>(
      queryFn: () => Promise<{ data: T[] | null; error: { message?: string } | null }>,
      retry: number = 0,
      tableName: string
    ): Promise<T[] | null> => {
      const startTime = Date.now();
      
      try {
        // Execute query with timeout to catch hanging queries
        console.log(`[${tableName}] Executing query at ${new Date().toISOString()}...`);
        
        // Create a timeout promise
        const timeoutMs = 15000; // 15 second timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Query timeout after ${timeoutMs}ms`));
          }, timeoutMs);
        });
        
        // Race between query and timeout
        let result;
        try {
          result = await Promise.race([queryFn(), timeoutPromise]);
        } catch (timeoutErr) {
          const elapsed = Date.now() - startTime;
          console.error(`[${tableName}] ⏱️ Query timed out after ${elapsed}ms`);
          console.error(`[${tableName}] This suggests the query is hanging - check:`);
          console.error(`  1. Network connectivity`);
          console.error(`  2. Browser Network tab for pending requests`);
          console.error(`  3. CORS settings in Supabase`);
          console.error(`  4. RLS policies on ${tableName} table`);
          throw timeoutErr;
        }
        
        const elapsed = Date.now() - startTime;
        const { data, error } = result;
        console.log(`[${tableName}] ✅ Query completed in ${elapsed}ms, status:`, {
          hasData: !!data,
          dataLength: data?.length || 0,
          hasError: !!error,
          errorMessage: error?.message || 'None',
        });
        
        if (error) {
          const errorWithCode = error as { message?: string; code?: string; details?: string; hint?: string };
          console.error(`[${tableName}] Query error after ${elapsed}ms:`, {
            message: error.message,
            code: errorWithCode.code,
            details: errorWithCode.details,
            hint: errorWithCode.hint
          });
          
          // Check if it's a network/RLS/auth error
          const isRetryableError = Boolean(
            error.message?.includes('fetch') || 
            error.message?.includes('network') ||
            error.message?.includes('Failed to fetch') ||
            error.message?.includes('timeout') ||
            error.message?.includes('JWT') ||
            errorWithCode.code === 'PGRST301' || // RLS policy violation
            errorWithCode.code === '42501' // Insufficient privilege
          );
          
          if (isRetryableError && retry < 1) {
            console.log(`[${tableName}] Retrying after error...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1)));
            return fetchWithRetry(queryFn, retry + 1, tableName);
          }
          
          hasNetworkError = true;
          return null;
        }
        
        const dataLength = data?.length || 0;
        console.log(`[${tableName}] Query completed in ${elapsed}ms, got ${dataLength} items`);
        
        if (data && data.length > 0) {
          hasAnySuccess = true;
          return data;
        }
        
        console.warn(`[${tableName}] Query returned empty data`);
        return null;
      } catch (err) {
        const elapsed = Date.now() - startTime;
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`[${tableName}] Exception after ${elapsed}ms:`, errorMessage);
        
        // Log full error details for debugging
        if (err instanceof Error) {
          console.error(`[${tableName}] Error stack:`, err.stack);
        }
        console.error(`[${tableName}] Full error object:`, err);
        
        // Don't retry on timeout - indicates a connectivity issue
        hasNetworkError = true;
        return null;
      }
    };

    try {
      console.log('Starting sequential queries at:', new Date().toISOString());
      
      // Execute queries sequentially to avoid race conditions
      // This is slower but more reliable when the connection is intermittent
      const staffData = await fetchWithRetry(async () => {
        console.log('[staff_members] Starting query...');
        return await supabase
          .from('staff_members')
          .select('name')
          .eq('active', true)
          .order('display_order');
      }, 0, 'staff_members');
      
      const channelData = await fetchWithRetry(async () => {
        console.log('[channels] Starting query...');
        return await supabase
          .from('channels')
          .select('name')
          .eq('active', true)
          .order('display_order');
      }, 0, 'channels');
      
      const branchData = await fetchWithRetry(async () => {
        console.log('[branches] Starting query...');
        return await supabase
          .from('branches')
          .select('name')
          .eq('active', true)
          .order('display_order');
      }, 0, 'branches');
      
      const categoryData = await fetchWithRetry(async () => {
        console.log('[categories] Starting query...');
        return await supabase
          .from('categories')
          .select('name')
          .eq('active', true)
          .order('display_order');
      }, 0, 'categories');
      
      console.log('All queries completed at:', new Date().toISOString());
      
      // Update with database data - only set if we got results, and save to localStorage
      if (staffData && staffData.length > 0) {
        const staffNames = staffData.map((s: { name: string }) => s.name);
        console.log(`[staff_members] Setting ${staffNames.length} items from database`);
        setStaffMembers(staffNames);
        saveToStorage(STORAGE_KEYS.staff, staffNames);
      } else {
        console.warn(`[staff_members] No data received from database`);
      }

      if (channelData && channelData.length > 0) {
        const channelNames = channelData.map((c: { name: string }) => c.name);
        console.log(`[channels] Setting ${channelNames.length} items from database`);
        setChannels(channelNames);
        saveToStorage(STORAGE_KEYS.channels, channelNames);
      } else {
        console.warn(`[channels] No data received from database`);
      }

      if (branchData && branchData.length > 0) {
        const branchNames = branchData.map((b: { name: string }) => b.name);
        console.log(`[branches] Setting ${branchNames.length} items from database`);
        setBranches(branchNames);
        saveToStorage(STORAGE_KEYS.branches, branchNames);
      } else {
        console.warn(`[branches] No data received from database`);
      }

      if (categoryData && categoryData.length > 0) {
        const categoryNames = categoryData.map((c: { name: string }) => c.name);
        console.log(`[categories] Setting ${categoryNames.length} items from database`);
        setCategories(categoryNames);
        saveToStorage(STORAGE_KEYS.categories, categoryNames);
      } else {
        console.warn(`[categories] No data received from database`);
      }

      // If we had network errors and no success, retry the whole operation
      if (hasNetworkError && !hasAnySuccess && retryCount < 2) {
        // Reset loading state before scheduling retry
        setLoadingOptions(false);
        setTimeout(() => {
          fetchFormOptions(retryCount + 1);
        }, 1000 * (retryCount + 1));
        return;
      }

      // Success or max retries reached - always set loading to false
      setLoadingOptions(false);

    } catch (err) {
      console.error('Unexpected error fetching form options:', err);
      // Don't set any data on error - leave arrays empty
      setLoadingOptions(false);
    }
  };

  const form = useForm<InteractionFormSchema>({
    resolver: zodResolver(interactionSchema),
    defaultValues: {
      staffName: "",
      channel: "",
      otherChannel: "",
      branch: "",
      category: "",
      otherCategory: "",
      purchased: undefined,
      outOfStock: undefined,
      wantedItem: "",
    },
  });

  const watchedChannel = form.watch("channel");
  const watchedCategory = form.watch("category");
  const watchedPurchased = form.watch("purchased");

  // Autofocus the first field
  useEffect(() => {
    if (firstFieldRef.current && !loadingOptions) {
      const firstRadio = firstFieldRef.current.querySelector('input[type="radio"]') as HTMLInputElement;
      if (firstRadio) {
        firstRadio.focus();
      }
    }
  }, [loadingOptions]);

  // Handle Enter key submission
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting) {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  };

  const resetForm = () => {
    form.reset({
      staffName: "",
      channel: "",
      otherChannel: "",
      branch: "",
      category: "",
      otherCategory: "",
      purchased: undefined,
      outOfStock: undefined,
      wantedItem: "",
    });
    // Re-focus first field after reset
    setTimeout(() => {
      if (firstFieldRef.current) {
        const firstRadio = firstFieldRef.current.querySelector('input[type="radio"]') as HTMLInputElement;
        if (firstRadio) {
          firstRadio.focus();
        }
      }
    }, 100);
  };

  const onSubmit = async (data: InteractionFormSchema) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/interactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        toast.success("Interaction saved successfully!");
        
        // Reset form after successful submission
        resetForm();
        
        // Silently check if form options have changed in the database
        // This runs in background without showing loading state
        // Only updates if data has actually changed, otherwise uses cached localStorage
        checkAndUpdateFormOptions(true).catch(err => {
          console.error('Error checking for form option updates:', err);
        });
      } else {
        // Handle error response
        const errorMessage = responseData.error || "Failed to save interaction";
        const errorDetails = responseData.details || responseData.hint || "";
        const fullErrorMessage = errorDetails 
          ? `${errorMessage}${errorDetails ? ` (${errorDetails})` : ""}`
          : errorMessage;
        
        console.error("API error:", responseData);
        toast.error(fullErrorMessage);
        
        // If it's a validation error, show field-specific errors
        if (responseData.details && typeof responseData.details === 'object') {
          Object.keys(responseData.details).forEach((field) => {
            form.setError(field as keyof InteractionFormSchema, {
              type: "server",
              message: responseData.details[field],
            });
          });
        }
      }
    } catch (error) {
      console.error("Form submission error:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to save. Please check your connection and try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = () => {
    // Force refresh - always allow user to retry, even if loading
    toast.info("Refreshing form options...");
    // Always reset loading state first, then fetch with fresh retry count
    setLoadingOptions(false);
    // Small delay to ensure state update, then fetch
    setTimeout(() => {
      fetchFormOptions(0);
    }, 50);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 relative">
      {/* Refresh Button - Always enabled so user can force refresh */}
      <button
        onClick={handleRefresh}
        className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg"
        title="Refresh form options"
      >
        <svg
          className={`w-4 h-4 ${loadingOptions ? 'animate-spin' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span className="text-sm font-medium">{loadingOptions ? 'Refreshing...' : 'Refresh'}</span>
      </button>
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-lg">
              <span className="text-2xl font-bold text-slate-700">P</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              PLAY Barbados
            </h1>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">
              Customer Interaction
            </h2>
            <div className="w-16 h-1 bg-slate-200 mx-auto rounded-full"></div>
          </div>
          <p className="text-slate-200 text-base">
            Quick form for staff to log customer interactions
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="space-y-6">
            {/* Staff Name */}
            <FormField
              control={form.control}
              name="staffName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold text-gray-800">Staff Name *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger 
                        className="h-14 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        data-name="staffName"
                      >
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {staffMembers.map((staff) => (
                        <SelectItem key={staff} value={staff}>
                          {staff}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Channel */}
            <FormField
              control={form.control}
              name="channel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold text-gray-800">Channel *</FormLabel>
                  <FormControl>
                    <div ref={firstFieldRef}>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-3 gap-3"
                      >
                      {channels.map((channel) => (
                        <div key={channel} className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={channel}
                            id={channel}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={channel}
                            className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-4 py-4 text-sm font-semibold transition-all duration-200 hover:bg-blue-50 hover:border-blue-400 hover:shadow-lg ${
                              field.value === channel
                                ? "border-4 border-blue-600 bg-blue-600 text-white shadow-xl ring-2 ring-blue-200"
                                : "border-gray-200 bg-white text-gray-700"
                            }`}
                          >
                            {channel}
                          </Label>
                        </div>
                      ))}
                      </RadioGroup>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Other Channel - only show if Other */}
            {watchedChannel === "Other" && (
              <FormField
                control={form.control}
                name="otherChannel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-gray-800">Specify Channel *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., TikTok, Snapchat, Website chat"
                        className="h-14 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Branch - only show if In-store */}
            {watchedChannel === "In-store" && (
              <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                                  <FormItem>
                  <FormLabel className="text-lg font-semibold text-gray-800">Branch *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-16 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                    </FormControl>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch} value={branch}>
                            {branch}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold text-gray-800">Category *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-16 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Other Category - only show if Other */}
            {watchedCategory === "Other" && (
              <FormField
                control={form.control}
                name="otherCategory"
                render={({ field }) => (
                                  <FormItem>
                  <FormLabel className="text-lg font-semibold text-gray-800">Specify Category *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter category"
                      className="h-14 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Which item were they interested in - show for all interactions */}
            {watchedChannel && (
              <FormField
                control={form.control}
                name="wantedItem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-gray-800">Which item were they interested in? *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Roblox $50, PS5 controller, SD card 128GB"
                        className="h-14 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Did they make a purchase - only show for In-store and WhatsApp */}
            {(watchedChannel === "In-store" || watchedChannel === "WhatsApp") && (
              <FormField
                control={form.control}
                name="purchased"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-gray-800">Did they make a purchase? *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === "true")}
                        value={field.value?.toString()}
                        className="grid grid-cols-2 gap-3"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="true"
                            id="purchased-yes"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="purchased-yes"
                            className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-4 py-4 text-sm font-semibold transition-all duration-200 hover:bg-green-50 hover:border-green-400 hover:shadow-lg ${
                              field.value === true
                                ? "border-4 border-green-600 bg-green-600 text-white shadow-xl ring-2 ring-green-200"
                                : "border-gray-200 bg-white text-gray-700"
                            }`}
                          >
                            Yes
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="false"
                            id="purchased-no"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="purchased-no"
                            className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-4 py-4 text-sm font-semibold transition-all duration-200 hover:bg-red-50 hover:border-red-400 hover:shadow-lg ${
                              field.value === false
                                ? "border-4 border-red-600 bg-red-600 text-white shadow-xl ring-2 ring-red-200"
                                : "border-gray-200 bg-white text-gray-700"
                            }`}
                          >
                            No
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Was the item in stock - only show if purchased = false */}
            {watchedPurchased === false && (
              <FormField
                control={form.control}
                name="outOfStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-gray-800">Was the item in stock? *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === "true")}
                        value={field.value?.toString()}
                        className="grid grid-cols-2 gap-3"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="true"
                            id="outofstock-yes"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="outofstock-yes"
                            className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-4 py-4 text-sm font-semibold transition-all duration-200 hover:bg-orange-50 hover:border-orange-400 hover:shadow-lg ${
                              field.value === true
                                ? "border-4 border-orange-600 bg-orange-600 text-white shadow-xl ring-2 ring-orange-200"
                                : "border-gray-200 bg-white text-gray-700"
                            }`}
                          >
                            Yes
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="false"
                            id="outofstock-no"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="outofstock-no"
                            className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-4 py-4 text-sm font-semibold transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 hover:shadow-lg ${
                              field.value === false
                                ? "border-4 border-gray-600 bg-gray-600 text-white shadow-xl ring-2 ring-gray-200"
                                : "border-gray-200 bg-white text-gray-700"
                            }`}
                          >
                            No
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Submit Button */}
            <div className="pt-6">
              <Button
                type="submit"
                className="w-full h-16 text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-slate-950 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </div>
                ) : (
                  "Save Interaction"
                )}
              </Button>
            </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
