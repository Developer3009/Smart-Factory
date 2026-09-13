import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const orgId = await getCurrentOrgId();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const tickets = await prisma.maintenanceTicket.findMany({
      where: { organizationId: orgId, ...(status && { status }), ...(type && { type }) },
      include: { plant: true, machine: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(tickets);
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const orgId = await getCurrentOrgId();
    const body = await req.json();
    if (!body.plantId || !body.title) return NextResponse.json({ error: "plantId and title required" }, { status: 400 });

    const ticket = await prisma.maintenanceTicket.create({
      data: {
        organizationId: orgId,
        plantId: body.plantId,
        machineId: body.machineId ?? null,
        title: body.title,
        description: body.description ?? null,
        type: body.type ?? "BREAKDOWN",
        priority: body.priority ?? "MEDIUM",
        assignedToId: body.assignedToId ?? null,
        estimatedHrs: body.estimatedHrs ?? null,
      },
      include: { plant: true, machine: true },
    });
    return NextResponse.json(ticket, { status: 201 });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

