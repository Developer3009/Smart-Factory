// tenant.ts — Re-exports from lib/auth.ts for backwards compatibility.
// All new code should import directly from "@/lib/auth".
export { getCurrentOrgId, getCurrentOrgIdSync, DEMO_ORG_ID } from "./auth";
