import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import PurchaseClient from "./PurchaseClient";

export default async function PurchasePage() {
  const { orgId } = await getAuthContext();
  let orders: any[] = [];
  let vendors: any[] = [];
  try {
    [orders, vendors] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where: { organizationId: orgId },
        include: { vendor: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.vendor.findMany({
        where: { organizationId: orgId },
        orderBy: { name: "asc" },
      }),
    ]);
  } catch (e) { console.error(e); }
  return <PurchaseClient orders={orders} vendors={vendors} />;
}
