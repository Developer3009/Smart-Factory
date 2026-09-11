import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { ROLES } from "@/lib/roles";

export async function GET() {
  try {
    const { orgId } = await getAuthContext();
    const machines = await prisma.machine.findMany({
      where: { organizationId: orgId },
      include: { plant: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(machines);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getAuthContext();
    if (ctx.isMember) {
      return NextResponse.json({ error: "Members have read-only machine access" }, { status: 403 });
    }

    const orgId = ctx.orgId;
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const machineType = typeof body.machineType === "string" ? body.machineType.trim() : "General";
    const allowedStatuses = ["RUNNING", "IDLE", "DOWN"];

    if (!name) return NextResponse.json({ error: "Machine name is required" }, { status: 400 });

    // The submitted plant must belong to the active organization.
    const plant = await prisma.plant.findFirst({
      where: { id: body.plantId || undefined, organizationId: orgId },
    });
    if (!plant) return NextResponse.json({ error: "No plant found for this org" }, { status: 400 });

    const machine = await prisma.machine.create({
      data: {
        organizationId: orgId,
        plantId: body.plantId ?? plant.id,
        name,
        description: body.description,
        machineType: machineType || "General",
        status: allowedStatuses.includes(body.status) ? body.status : "IDLE",
      },
      include: { plant: true },
    });
    return NextResponse.json(machine, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
