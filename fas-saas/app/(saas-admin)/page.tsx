import { requireSaasAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SaasAdminDashboard from "./SaasAdminDashboard";

export default async function SaasAdminPage() {
  await requireSaasAdmin();

  const [orgsCount, totalWorkOrders, totalMachines, totalInventoryItems] = await Promise.all([
    prisma.organization.count(),
    prisma.workOrder.count(),
    prisma.machine.count(),
    prisma.inventoryItem.count(),
  ]);

  // Fetch orgs WITH their members (login details)
  const organizations = await prisma.organization.findMany({
    include: {
      _count: { select: { users: true, plants: true, workOrders: true } },
      users: {
        select: { id: true, name: true, email: true, role: true, clerkUserId: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const planCounts = await prisma.organization.groupBy({
    by: ["plan"],
    _count: { _all: true },
  });

  return (
    <SaasAdminDashboard
      stats={{ orgsCount, totalWorkOrders, totalMachines, totalInventoryItems }}
      organizations={organizations}
      planCounts={planCounts}
    />
  );
}
