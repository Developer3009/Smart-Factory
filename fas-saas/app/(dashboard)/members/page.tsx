import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import MembersClient from "./MembersClient";

export default async function MembersPage() {
  const { orgId, role } = await requireAdmin();

  const members = await prisma.orgUser.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "asc" },
  });

  return <MembersClient members={members} role={role} orgId={orgId} />;
}
