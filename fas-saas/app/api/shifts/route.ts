import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const orgId = await getCurrentOrgId();
    const { searchParams } = new URL(req.url);
    const plantId = searchParams.get("plantId");

    const shifts = await prisma.shift.findMany({
      where: { organizationId: orgId, ...(plantId && { plantId }) },
      include: { plant: true, assignments: { include: { user: true }, orderBy: { workDate: "desc" }, take: 20 } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(shifts);
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const orgId = await getCurrentOrgId();
    const body = await req.json();
    if (!body.plantId || !body.name || !body.startTime || !body.endTime) {
      return NextResponse.json({ error: "plantId, name, startTime, endTime required" }, { status: 400 });
    }
    const shift = await prisma.shift.create({
      data: {
        organizationId: orgId,
        plantId: body.plantId,
        name: body.name,
        startTime: body.startTime,
        endTime: body.endTime,
      },
      include: { plant: true },
    });
    return NextResponse.json(shift, { status: 201 });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

