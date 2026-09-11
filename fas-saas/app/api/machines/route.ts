import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgId } from "@/lib/tenant";

export async function GET() {
  try {
    const orgId = await getCurrentOrgId();
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
    const orgId = await getCurrentOrgId();
    const body = await req.json();

    // Ensure plant belongs to the org
    const plant = await prisma.plant.findFirst({ where: { organizationId: orgId } });
    if (!plant) return NextResponse.json({ error: "No plant found for this org" }, { status: 400 });

    const machine = await prisma.machine.create({
      data: {
        organizationId: orgId,
        plantId: body.plantId ?? plant.id,
        name: body.name,
        description: body.description,
        machineType: body.machineType ?? "General",
        status: body.status ?? "IDLE",
      },
      include: { plant: true },
    });
    return NextResponse.json(machine, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
