import { prisma } from "@/lib/prisma";
import { requireOrgAdmin } from "@/lib/auth";
import CustomersClient from "./CustomersClient";

export default async function CustomersPage() {
  const { orgId } = await requireOrgAdmin();
  let customers: any[] = [];
  try { customers = await prisma.customer.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: "desc" } }); } catch {}
  return <CustomersClient customers={customers} orgId={orgId} />;
}
