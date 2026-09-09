import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import ProductionClient from "./ProductionClient";

export default async function ProductionPage() {
  const { orgId } = await getAuthContext();
  let workOrders: any[] = [];
  try {
    workOrders = await prisma.workOrder.findMany({
      where: { organizationId: orgId },
      include: {
        product: true,
        plant: { include: { machines: { take: 1 } } },
        routingSteps: { orderBy: { stepNumber: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {}
  return <ProductionClient workOrders={workOrders} />;
}
