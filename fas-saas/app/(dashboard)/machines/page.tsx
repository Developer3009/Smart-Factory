import { prisma } from "@/lib/prisma";
import MachinesClient from "./MachinesClient";

export default async function MachinesPage() {
  let machines: any[] = [];
  try {
    machines = await prisma.machine.findMany({
      include: { plant: true },
      orderBy: { createdAt: "asc" },
    });
  } catch {}

  return <MachinesClient machines={machines} />;
}
