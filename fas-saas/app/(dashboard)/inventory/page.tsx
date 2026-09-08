import { prisma } from "@/lib/prisma";
import InventoryClient from "./InventoryClient";

export default async function InventoryPage() {
  let items: any[] = [];
  try {
    items = await prisma.inventoryItem.findMany({
      orderBy: { createdAt: "asc" },
    });
  } catch {}

  return <InventoryClient items={items} />;
}
