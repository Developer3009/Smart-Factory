import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import InventoryClient from "./InventoryClient";

export default async function InventoryPage() {
  const { orgId } = await getAuthContext();
  let items: any[] = [];
  try {
    items = await prisma.inventoryItem.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "asc" },
    });
  } catch {}
  return <InventoryClient items={items} />;
}
