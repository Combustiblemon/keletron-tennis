/**
 * Tests for lib/api/hooks.ts — public-page detection used by the 401 handler.
 *
 * Regression target from the 2026-08-06 persistent-login fix:
 * - isPublicPage() matches sub-routes of public pages (e.g. Clerk's
 *   /sign-in/factor-one) so a 401 there never triggers a redirect loop,
 *   while '/' stays an exact match.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ getToken: vi.fn() }),
}));

import { isPublicPage } from '@/lib/api/hooks';

describe('isPublicPage', () => {
  it('matches public pages exactly', () => {
    expect(isPublicPage('/')).toBe(true);
    expect(isPublicPage('/auth')).toBe(true);
    expect(isPublicPage('/sign-in')).toBe(true);
    expect(isPublicPage('/sign-up')).toBe(true);
  });

  it('matches sub-routes of public pages', () => {
    expect(isPublicPage('/sign-in/factor-one')).toBe(true);
    expect(isPublicPage('/sign-up/verify-email-address')).toBe(true);
  });

  it('does not treat every path as a sub-route of /', () => {
    expect(isPublicPage('/reservations')).toBe(false);
    expect(isPublicPage('/admin')).toBe(false);
    expect(isPublicPage('/sign-in-fake')).toBe(false);
  });
});
