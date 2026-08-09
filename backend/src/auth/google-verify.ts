import { UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

/**
 * Verifies a Google ID token (the JWT that Google Identity Services hands the
 * browser after "Continue with Google").
 *
 * Verification is done locally against Google's public signing keys — the
 * library fetches and caches them — so this is a signature + claims check, not
 * a network round trip per sign-in. Critically it also pins the `aud` claim to
 * our own client ID: without that, an ID token minted for *any other* Google
 * app would be accepted here.
 */

export interface GoogleIdentity {
  email: string;
  name: string;
  picture?: string;
}

let client: OAuth2Client | null = null;

export function googleClientId(): string | undefined {
  return process.env.GOOGLE_CLIENT_ID?.trim() || undefined;
}

export function googleConfigured(): boolean {
  return !!googleClientId();
}

export async function verifyGoogleIdToken(idToken?: string): Promise<GoogleIdentity> {
  const clientId = googleClientId();
  if (!clientId) throw new UnauthorizedException('Google sign-in is not configured');
  if (!idToken) throw new UnauthorizedException('Missing Google token');

  if (!client) client = new OAuth2Client(clientId);

  let payload: any;
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    payload = ticket.getPayload();
  } catch {
    throw new UnauthorizedException('Invalid or expired Google sign-in');
  }

  const email = (payload?.email || '').toLowerCase().trim();
  if (!email) throw new UnauthorizedException('That Google account has no email address');
  // Google sets this false for unverified accounts — don't let one claim
  // someone else's email-registered account.
  if (payload.email_verified === false) {
    throw new UnauthorizedException('Your Google email address is not verified');
  }

  return { email, name: payload.name || payload.given_name || email.split('@')[0], picture: payload.picture };
}
