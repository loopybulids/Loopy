'use client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser Supabase client for seller auth (Google OAuth + email OTP).
 * Returns null if env isn't configured, so the UI can degrade gracefully.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;

export const supabaseEnabled = !!supabase;
