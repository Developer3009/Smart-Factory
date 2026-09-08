// Server-side tenant resolution using Clerk auth context.
// Falls back to demo-org-1 for local dev without Clerk session.

import { auth } from "@clerk/nextjs/server";

export const DEMO_ORG_ID = "demo-org-1";

/**
 * Returns the current tenant's organization ID.
 * In production: reads from Clerk auth session (orgId or userId as fallback).
 * In local dev without Clerk: returns DEMO_ORG_ID.
 */
export async function getCurrentOrgId(): Promise<string> {
  try {
    const { orgId, userId } = await auth();
    // If user belongs to a Clerk Organization, use that as the tenant key
    if (orgId) return orgId;
    // If solo user (no org), use their userId as the tenant key
    if (userId) return userId;
  } catch {
    // auth() throws if called outside Clerk context (e.g. seed scripts)
  }
  return process.env.NEXT_PUBLIC_ORG_ID ?? DEMO_ORG_ID;
}

/**
 * Synchronous version for non-async contexts (e.g. client-side env var checks).
 * Always returns the demo org — use getCurrentOrgId() on the server.
 */
export function getCurrentOrgIdSync(): string {
  return process.env.NEXT_PUBLIC_ORG_ID ?? DEMO_ORG_ID;
}
