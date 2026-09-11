import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import MachinesClient from "./MachinesClient";

export default async function MachinesPage() {
  const { orgId, role } = await getAuthContext();
  let machines: any[] = [];
  let plants: any[] = [];
  try {
    [machines, plants] = await Promise.all([
      prisma.machine.findMany({
        where: { organizationId: orgId },
        include: { plant: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.plant.findMany({
        where: { organizationId: orgId },
        orderBy: { name: "asc" },
      }),
    ]);
  } catch {}
  return <MachinesClient machines={machines} plants={plants} role={role} />;
}
