import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentOrgId, getCurrentOrgIdSync, DEMO_ORG_ID } from '../lib/auth';

// Mock the clerk auth server function
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';

describe('Auth Helpers - Tenant Scoping Logic', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
  });

  describe('getCurrentOrgIdSync', () => {
    it('throws an error instead of relying on env vars', () => {
      expect(() => getCurrentOrgIdSync()).toThrow(/insecure for tenant scoping/);
    });
  });

  describe('getCurrentOrgId', () => {
    it('returns orgId from Clerk if available', async () => {
      (auth as any).mockResolvedValue({ orgId: 'clerk-org-123', userId: 'user_123' });
      const result = await getCurrentOrgId();
      expect(result).toBe('clerk-org-123');
    });

    it('returns userId from Clerk if no orgId is present (solo user fallback)', async () => {
      (auth as any).mockResolvedValue({ orgId: null, userId: 'user_123' });
      const result = await getCurrentOrgId();
      expect(result).toBe('user_123');
    });

    it('throws or redirects if auth fails or is empty', async () => {
      (auth as any).mockRejectedValue(new Error('Auth failed'));
      await expect(getCurrentOrgId()).rejects.toThrow('Auth failed');
    });

    it('redirects if no userId is present', async () => {
      (auth as any).mockResolvedValue({ orgId: null, userId: null });
      // Since redirect throws a specific NEXT_REDIRECT error in Next.js, we just check if it throws
      await expect(getCurrentOrgId()).rejects.toThrow();
    });

    it('handles SaaS admin edge case correctly', async () => {
      // Set the SaaS admin
      process.env.SAAS_ADMIN_CLERK_USER_IDS = 'admin_123';
      
      // Admin without active org
      (auth as any).mockResolvedValue({ orgId: null, userId: 'admin_123' });
      const result1 = await getCurrentOrgId();
      expect(result1).toBe(DEMO_ORG_ID);

      // Admin with active org (should return the active org)
      (auth as any).mockResolvedValue({ orgId: 'some-org-123', userId: 'admin_123' });
      const result2 = await getCurrentOrgId();
      expect(result2).toBe('some-org-123');
    });
  });
});
