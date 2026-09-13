import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const orgId = await getCurrentOrgId();
    const { searchParams } = new URL(req.url);
    const plantId = searchParams.get("plantId");
    const result  = searchParams.get("result");

    const inspections = await prisma.qcInspection.findMany({
      where: {
        organizationId: orgId,
        ...(plantId && { plantId }),
        ...(result  && { result }),
      },
      include: { nonConformances: true, plant: true },
      orderBy: { inspectedAt: "desc" },
      take: 100,
    });
    return NextResponse.json(inspections);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const orgId = await getCurrentOrgId();
    const body  = await req.json();
    if (!body.plantId) return NextResponse.json({ error: "plantId required" }, { status: 400 });

    const inspection = await prisma.qcInspection.create({
      data: {
        organizationId: orgId,
        plantId:        body.plantId,
        workOrderId:    body.workOrderId    ?? null,
        inspectorId:    body.inspectorId    ?? null,
        inspectionType: body.inspectionType ?? "INLINE",
        result:         body.result         ?? null,
        sampleSize:     body.sampleSize     ?? 1,
        defectsFound:   body.defectsFound   ?? 0,
        notes:          body.notes          ?? null,
      },
      include: { nonConformances: true, plant: true },
    });
    return NextResponse.json(inspection, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

