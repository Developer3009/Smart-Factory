import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import QcClient from "./QcClient";

export default async function QcPage() {
  const { orgId } = await getAuthContext();
  let inspections: any[] = [];
  let plants: any[] = [];
  try {
    [inspections, plants] = await Promise.all([
      prisma.qcInspection.findMany({ where: { organizationId: orgId }, include: { nonConformances: true, plant: true }, orderBy: { inspectedAt: "desc" }, take: 100 }),
      prisma.plant.findMany({ where: { organizationId: orgId } }),
    ]);
  } catch {}
  return <QcClient inspections={inspections} plants={plants} />;
}
