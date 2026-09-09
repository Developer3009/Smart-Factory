import { prisma } from "@/lib/prisma";
import { requireOrgAdmin } from "@/lib/auth";
import { auth, clerkClient } from "@clerk/nextjs/server";
import type { OrgUser } from "@prisma/client";
import MembersClient from "./MembersClient";

export default async function MembersPage() {
  const { orgId, role } = await requireOrgAdmin();
  let members: OrgUser[] = [];
  let loadError = "";

  try {
    members = await prisma.orgUser.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "asc" },
    });
  } catch (error) {
    console.error("Failed to load organization members", error);
    try {
      const { orgId: clerkOrgId } = await auth();
      if (clerkOrgId) {
        const memberships = await (await clerkClient()).organizations.getOrganizationMembershipList({
          organizationId: clerkOrgId,
          limit: 100,
        });
        members = memberships.data.map((membership) => ({
          id: membership.id,
          organizationId: orgId,
          clerkUserId: membership.publicUserData?.userId ?? "unknown",
          name: [membership.publicUserData?.firstName, membership.publicUserData?.lastName].filter(Boolean).join(" ") || "Clerk user",
          email: membership.publicUserData?.identifier ?? null,
          role: membership.role === "org:admin" ? "ADMIN" : "OPERATOR",
          createdAt: new Date(membership.createdAt),
        }));
        loadError = "Showing live Clerk memberships while the application database is unavailable.";
      } else {
        loadError = "Members could not be loaded because no active organization is selected.";
      }
    } catch (fallbackError) {
      console.error("Failed to load Clerk organization members", fallbackError);
      loadError = "Members could not be loaded. Configure a reachable PostgreSQL database.";
    }
  }

  return <MembersClient members={members} role={role} orgId={orgId} loadError={loadError} />;
}
