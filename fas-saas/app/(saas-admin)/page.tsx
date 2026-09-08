import { requireSaasAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SaasAdminDashboard from "./SaasAdminDashboard";

export default async function SaasAdminPage() {
  // 🔒 Only SaaS admin can access — anyone else is redirected to /unauthorized
  await requireSaasAdmin();

  // Fetch aggregate stats across ALL organizations (no orgId filter)
  const [orgsCount, totalWorkOrders, totalMachines, totalInventoryItems] = await Promise.all([
    prisma.organization.count(),
    prisma.workOrder.count(),
    prisma.machine.count(),
    prisma.inventoryItem.count(),
  ]);

  // Org breakdown
  const organizations = await prisma.organization.findMany({
    include: {
      _count: {
        select: {
          users: true,
          plants: true,
          workOrders: true,
          // machines are on Plant, not Organization — counted via plants
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Plan breakdown
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
