import { prisma } from "@/lib/prisma";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage() {
  let products: any[] = [];
  let inventoryItems: any[] = [];
  try {
    [products, inventoryItems] = await Promise.all([
      prisma.product.findMany({
        include: { bomItems: { include: { item: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.inventoryItem.findMany({
        where: { type: "RAW_MATERIAL" },
        orderBy: { name: "asc" },
      }),
    ]);
  } catch (e) {
    console.error(e);
  }
  return <ProductsClient products={products} inventoryItems={inventoryItems} />;
}
