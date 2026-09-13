import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgId } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const orgId = await getCurrentOrgId();
    const body  = await req.json();
    const existing = await prisma.qcInspection.findFirst({ where: { id: id, organizationId: orgId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.qcInspection.update({
      where: { id: id },
      data: { result: body.result ?? existing.result, defectsFound: body.defectsFound ?? existing.defectsFound, notes: body.notes ?? existing.notes },
    });
    if (body.result === "FAIL" && body.nonConformance) {
      await prisma.nonConformance.create({
        data: { inspectionId: id, description: body.nonConformance.description ?? "Defect found", severity: body.nonConformance.severity ?? "MEDIUM", rootCause: body.nonConformance.rootCause ?? null, correctiveAction: body.nonConformance.correctiveAction ?? null },
      });
    }
    return NextResponse.json(updated);
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const orgId = await getCurrentOrgId();
    const existing = await prisma.qcInspection.findFirst({ where: { id: id, organizationId: orgId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.qcInspection.delete({ where: { id: id } });
    return NextResponse.json({ success: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}


