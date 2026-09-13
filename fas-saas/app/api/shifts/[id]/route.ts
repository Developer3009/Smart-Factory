import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgId } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const orgId = await getCurrentOrgId();
    const body = await req.json();

    // If assigning a user to this shift
    if (body.assignUserId && body.workDate) {
      const assignment = await prisma.shiftAssignment.upsert({
        where: { userId_shiftId_workDate: { userId: body.assignUserId, shiftId: id, workDate: new Date(body.workDate) } },
        create: { userId: body.assignUserId, shiftId: id, workDate: new Date(body.workDate), notes: body.notes ?? null },
        update: { notes: body.notes ?? null },
      });
      return NextResponse.json(assignment);
    }

    // Otherwise update shift itself
    const existing = await prisma.shift.findFirst({ where: { id: id, organizationId: orgId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.shift.update({
      where: { id: id },
      data: { name: body.name ?? existing.name, startTime: body.startTime ?? existing.startTime, endTime: body.endTime ?? existing.endTime },
    });
    return NextResponse.json(updated);
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const orgId = await getCurrentOrgId();
    const existing = await prisma.shift.findFirst({ where: { id: id, organizationId: orgId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.shift.delete({ where: { id: id } });
    return NextResponse.json({ success: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}


