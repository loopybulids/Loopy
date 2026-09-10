import { api } from './api';
import { clearApiDataCache } from './use-api-data';

/** Admin enters a seller's console. Backs up the admin session so it can be restored. */
export async function impersonateSeller(id: string) {
  const r = await api.adminImpersonate(id);
  localStorage.setItem('loopy_admin_backup', JSON.stringify({
    token: localStorage.getItem('loopy_token'),
    role: localStorage.getItem('loopy_role'),
    user: localStorage.getItem('loopy_user'),
    name: localStorage.getItem('loopy_name'),
  }));
  localStorage.setItem('loopy_token', r.accessToken);
  localStorage.setItem('loopy_user', JSON.stringify(r.user));
  localStorage.setItem('loopy_role', 'seller');
  localStorage.setItem('loopy_name', r.storeName || 'Store');
  localStorage.setItem('loopy_impersonating', r.storeName || '1');
  clearApiDataCache();
  window.location.href = '/seller';
}

/** Restore the admin session and return to the command center. */
export function exitImpersonation() {
  try {
    const b = JSON.parse(localStorage.getItem('loopy_admin_backup') || '{}');
    if (b.token) localStorage.setItem('loopy_token', b.token);
    if (b.role) localStorage.setItem('loopy_role', b.role);
    if (b.user) localStorage.setItem('loopy_user', b.user);
    if (b.name) localStorage.setItem('loopy_name', b.name);
  } catch { /* ignore */ }
  localStorage.removeItem('loopy_admin_backup');
  localStorage.removeItem('loopy_impersonating');
  clearApiDataCache();
  window.location.href = '/admin';
}
