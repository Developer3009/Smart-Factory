import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage() {
  const { orgId } = await getAuthContext();
  let products: any[] = [];
  let inventoryItems: any[] = [];
  try {
    [products, inventoryItems] = await Promise.all([
      prisma.product.findMany({
        where: { organizationId: orgId },
        include: { bomItems: { include: { item: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.inventoryItem.findMany({
        where: { organizationId: orgId, type: "RAW_MATERIAL" },
        orderBy: { name: "asc" },
      }),
    ]);
  } catch (e) { console.error(e); }
  return <ProductsClient products={products} inventoryItems={inventoryItems} />;
}
