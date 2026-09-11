import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { ROLES } from "@/lib/roles";

// GET /api/organizations — SaaS admin only: list all organizations with members
export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx.isSaasAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const orgs = await prisma.organization.findMany({
      include: {
        _count: { select: { users: true, plants: true, workOrders: true } },
        users: { select: { id: true, name: true, email: true, role: true, clerkUserId: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orgs);
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

// POST /api/organizations — SaaS admin only: create a new organization
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx.isSaasAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { name, plan } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
    const org = await prisma.organization.create({
      data: { name: name.trim(), plan: plan || "STARTER" },
    });
    return NextResponse.json(org, { status: 201 });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
