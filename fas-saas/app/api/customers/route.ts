import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { ROLES } from "@/lib/roles";

export async function GET() {
  try {
    const { orgId } = await getAuthContext();
    const customers = await prisma.customer.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: "desc" } });
    return NextResponse.json(customers);
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 401 }); }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (ctx.role !== ROLES.ORG_ADMIN && ctx.role !== ROLES.SAAS_ADMIN) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { name, email, phone, address } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const customer = await prisma.customer.create({
      data: { organizationId: ctx.orgId, name: name.trim(), email: email || null, phone: phone || null, address: address || null },
    });
    return NextResponse.json(customer, { status: 201 });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
