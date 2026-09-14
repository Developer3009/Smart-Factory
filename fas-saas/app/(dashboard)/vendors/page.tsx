import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import VendorsClient from "./VendorsClient";

export default async function VendorsPage() {
  const { orgId } = await requireAdmin();
  let vendors: any[] = [];
  try { vendors = await prisma.vendor.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: "desc" } }); } catch {}
  return <VendorsClient vendors={vendors} orgId={orgId} />;
}
