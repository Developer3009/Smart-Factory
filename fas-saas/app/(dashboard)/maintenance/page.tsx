import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import MaintenanceClient from "./MaintenanceClient";

export default async function MaintenancePage() {
  const { orgId } = await getAuthContext();
  let tickets: any[] = [];
  let schedules: any[] = [];
  let machines: any[] = [];
  let plants: any[] = [];
  try {
    [tickets, schedules, machines, plants] = await Promise.all([
      prisma.maintenanceTicket.findMany({ where: { organizationId: orgId }, include: { plant: true, machine: true }, orderBy: { createdAt: "desc" } }),
      prisma.maintenanceSchedule.findMany({ where: { organizationId: orgId, isActive: true }, include: { plant: true, machine: true }, orderBy: { nextDueAt: "asc" } }),
      prisma.machine.findMany({ where: { organizationId: orgId } }),
      prisma.plant.findMany({ where: { organizationId: orgId } }),
    ]);
  } catch {}
  return <MaintenanceClient tickets={tickets} schedules={schedules} machines={machines} plants={plants} />;
}
