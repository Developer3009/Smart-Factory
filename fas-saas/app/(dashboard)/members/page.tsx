import { prisma } from "@/lib/prisma";
import { requireOrgAdmin } from "@/lib/auth";
import MembersClient from "./MembersClient";

export default async function MembersPage() {
  const { orgId } = await requireOrgAdmin();

  const members = await prisma.orgUser.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "asc" },
  });

  return <MembersClient members={members} />;
}
