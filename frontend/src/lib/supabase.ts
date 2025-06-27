import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'sb-cbqwhkjttgkckhrdwhnx-auth-token',
  },
  global: {
    headers: {
      'x-application-name': 'astra-hub'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

export async function retryableQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): Promise<{ data: T | null; error: any }> {
  const maxRetries = options.maxRetries ?? MAX_RETRIES;
  const initialDelay = options.initialDelay ?? INITIAL_RETRY_DELAY;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const result = await queryFn();
      
      // If there's no error, return the result
      if (!result.error) {
        return result;
      }

      // If it's an authentication error, don't retry
      if (result.error.code === 'PGRST301' || result.error.code === '401') {
        return result;
      }

      // For other errors, retry
      attempt++;
      
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
        options.onRetry?.(attempt, result.error);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        return result;
      }
    } catch (error) {
      attempt++;
      
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        options.onRetry?.(attempt, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        return { data: null, error };
      }
    }
  }

  return { data: null, error: new Error('Max retries exceeded') };
}