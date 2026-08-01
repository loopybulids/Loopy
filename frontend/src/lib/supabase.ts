'use client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser Supabase client for seller auth (Google OAuth + email OTP).
 * Returns null if env isn't configured, so the UI can degrade gracefully.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Supabase renamed the client key "anon" → "publishable" (sb_publishable_…).
// Accept either name so both old and new project keys work.
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;

export const supabaseEnabled = !!supabase;
