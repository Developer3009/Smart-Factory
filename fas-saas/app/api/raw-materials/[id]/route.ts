import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { ROLES } from "@/lib/roles";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getAuthContext();
    if (ctx.role !== ROLES.ADMIN && ctx.role !== ROLES.SAAS_ADMIN) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!ctx.isSaasAdmin && item.organizationId !== ctx.orgId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.inventoryItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}



