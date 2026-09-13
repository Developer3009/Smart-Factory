import { requireSaasAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MachineTestClient from "./MachineTestClient";

export default async function MachineTestPage() {
  await requireSaasAdmin();
  const machines = await prisma.machine.findMany({ include: { plant: { include: { organization: true } }, statusLogs: { orderBy: { changedAt: "desc" }, take: 5 } } }).catch(() => []);
  return <MachineTestClient machines={machines} />;
}
