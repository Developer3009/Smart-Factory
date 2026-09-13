import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgId } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const orgId = await getCurrentOrgId();
    const body = await req.json();
    const existing = await prisma.maintenanceTicket.findFirst({ where: { id: id, organizationId: orgId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.maintenanceTicket.update({
      where: { id: id },
      data: {
        status: body.status ?? existing.status,
        priority: body.priority ?? existing.priority,
        assignedToId: body.assignedToId ?? existing.assignedToId,
        actualHrs: body.actualHrs ?? existing.actualHrs,
        resolvedAt: body.status === "RESOLVED" || body.status === "CLOSED" ? new Date() : existing.resolvedAt,
      },
    });
    return NextResponse.json(updated);
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const orgId = await getCurrentOrgId();
    const existing = await prisma.maintenanceTicket.findFirst({ where: { id: id, organizationId: orgId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.maintenanceTicket.delete({ where: { id: id } });
    return NextResponse.json({ success: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}


