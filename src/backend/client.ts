import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Created by authenticated UI features when they replace the synthetic prototype.
// Only a public/publishable key belongs here; never a service-role key.
export function createBackendClient(
  url: string = import.meta.env.VITE_SUPABASE_URL,
  publishableKey: string = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
) {
  if (!url || !publishableKey) throw new Error('Configure the Supabase URL and publishable key')
  return createClient<Database>(url, publishableKey)
}
