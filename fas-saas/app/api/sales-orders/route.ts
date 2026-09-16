import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { withPermission } from "@/lib/api-middleware";
import { salesOrderSchema, paginationSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/api-errors";

export async function GET(req: NextRequest) {
  try {
    const { orgId } = await getAuthContext();
    const { searchParams } = new URL(req.url);
    const { take, skip } = paginationSchema.parse({
      take: searchParams.get("take") || undefined,
      skip: searchParams.get("skip") || undefined,
    });

    const orders = await prisma.salesOrder.findMany({
      where: { organizationId: orgId },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });
    return NextResponse.json(orders);
  } catch (err: any) {
    if (err.message && err.message.includes("NEXT_REDIRECT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handleApiError(err);
  }
}

export const POST = withPermission("orders", "create", async (req: NextRequest, context: any, orgId: string) => {
  const body = await req.json();
  const data = salesOrderSchema.parse(body);

  const order = await prisma.salesOrder.create({
    data: {
      organizationId: orgId,
      customerId: data.customerId,
      amount: data.amount,
      status: data.status || "PENDING",
    },
  });
  return NextResponse.json(order, { status: 201 });
});
