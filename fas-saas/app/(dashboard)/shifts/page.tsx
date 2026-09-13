import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import ShiftsClient from "./ShiftsClient";

export default async function ShiftsPage() {
  const { orgId } = await getAuthContext();
  let shifts: any[] = [];
  let members: any[] = [];
  let plants: any[] = [];
  try {
    [shifts, members, plants] = await Promise.all([
      prisma.shift.findMany({ where: { organizationId: orgId }, include: { plant: true, assignments: { include: { user: true }, orderBy: { workDate: "desc" }, take: 10 } }, orderBy: { createdAt: "desc" } }),
      prisma.orgUser.findMany({ where: { organizationId: orgId, isActive: true }, select: { id: true, name: true, email: true, role: true } }),
      prisma.plant.findMany({ where: { organizationId: orgId } }),
    ]);
  } catch {}
  return <ShiftsClient shifts={shifts} members={members} plants={plants} />;
}
