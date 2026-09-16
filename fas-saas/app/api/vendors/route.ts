import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { withPermission } from "@/lib/api-middleware";
import { vendorSchema, paginationSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/api-errors";

export async function GET(req: NextRequest) {
  try {
    const { orgId } = await getAuthContext();
    const { searchParams } = new URL(req.url);
    const { take, skip } = paginationSchema.parse({
      take: searchParams.get("take") || undefined,
      skip: searchParams.get("skip") || undefined,
    });

    const vendors = await prisma.vendor.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });
    return NextResponse.json(vendors);
  } catch (err: any) {
    if (err.message && err.message.includes("NEXT_REDIRECT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handleApiError(err);
  }
}

export const POST = withPermission("vendors", "create", async (req: NextRequest, context: any, orgId: string) => {
  const body = await req.json();
  const data = vendorSchema.parse(body);

  const vendor = await prisma.vendor.create({
    data: {
      organizationId: orgId,
      name: data.name,
      email: data.email,
      phone: data.phone,
    },
  });
  return NextResponse.json(vendor, { status: 201 });
});
