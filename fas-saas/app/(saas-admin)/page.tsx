import { requireSaasAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import SaasAdminDashboard from "./SaasAdminDashboard";

export default async function SaasAdminPage() {
  await requireSaasAdmin();

  let stats = { orgsCount: 0, totalWorkOrders: 0, totalMachines: 0, totalInventoryItems: 0 };
  let organizations: any[] = [];
  let planCounts: any[] = [];

  try {
    const [orgsCount, totalWorkOrders, totalMachines, totalInventoryItems] = await Promise.all([
      prisma.organization.count(),
      prisma.workOrder.count(),
      prisma.machine.count(),
      prisma.inventoryItem.count(),
    ]);
    stats = { orgsCount, totalWorkOrders, totalMachines, totalInventoryItems };
    organizations = await prisma.organization.findMany({
      include: {
        _count: { select: { users: true, plants: true, workOrders: true } },
        users: {
          select: { id: true, name: true, email: true, role: true, clerkUserId: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    planCounts = await prisma.organization.groupBy({
      by: ["plan"],
      _count: { _all: true },
    }) as any;
  } catch (error) {
    console.error("Local organization database unavailable", error);
    const clerkOrganizations = await (await clerkClient()).organizations.getOrganizationList({
      limit: 100,
      orderBy: "-created_at",
      includeMembersCount: true,
    });
    organizations = clerkOrganizations.data.map((organization) => ({
      id: organization.id,
      name: organization.name,
      plan: "UNSYNCED",
      createdAt: new Date(organization.createdAt),
      _count: { users: organization.membersCount ?? 0, plants: 0, workOrders: 0 },
      users: [],
    }));
    stats.orgsCount = organizations.length;
  }

  return (
    <SaasAdminDashboard
      stats={stats}
      organizations={organizations}
      planCounts={planCounts}
    />
  );
}
