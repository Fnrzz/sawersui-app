import { createBrowserClient } from '@supabase/ssr'
import { CONFIG } from '@/lib/config'

export function createClient() {
  return createBrowserClient(
    CONFIG.SUPABASE.URL,
    CONFIG.SUPABASE.ANON_KEY
  )
}
