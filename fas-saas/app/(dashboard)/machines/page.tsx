import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import MachinesClient from "./MachinesClient";

export default async function MachinesPage() {
  const { orgId } = await getAuthContext();
  let machines: any[] = [];
  try {
    machines = await prisma.machine.findMany({
      where: { plant: { organizationId: orgId } },
      include: { plant: true },
      orderBy: { createdAt: "asc" },
    });
  } catch {}
  return <MachinesClient machines={machines} />;
}
