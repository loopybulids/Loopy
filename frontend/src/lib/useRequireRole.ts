'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, Role } from '@/store/auth';

/**
 * Client-side gate. Hydrates the session on mount and, once ready, bounces
 * anyone who isn't signed in with the required role to that role's login.
 * Returns the auth state so pages can render a loader until `ready`.
 */
export function useRequireRole(required: Role) {
  const router = useRouter();
  const auth = useAuth();
  const { ready, role, hydrate } = auth;

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!ready) return;
    if (role !== required) {
      router.replace(required === 'seller' ? '/seller/login' : '/login');
    }
  }, [ready, role, required, router]);

  return auth;
}
