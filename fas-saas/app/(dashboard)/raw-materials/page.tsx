import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import RawMaterialsClient from "./RawMaterialsClient";

export default async function RawMaterialsPage() {
  const { orgId } = await getAuthContext();
  let items: any[] = [];
  try { items = await prisma.inventoryItem.findMany({ where: { organizationId: orgId, type: "RAW_MATERIAL" }, orderBy: { name: "asc" } }); } catch {}
  return <RawMaterialsClient items={items} orgId={orgId} />;
}
