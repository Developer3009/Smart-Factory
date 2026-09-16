import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { withPermission } from "@/lib/api-middleware";
import { productSchema, paginationSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/api-errors";

export async function GET(req: NextRequest) {
  try {
    const { orgId } = await getAuthContext();
    const { searchParams } = new URL(req.url);
    const { take, skip } = paginationSchema.parse({
      take: searchParams.get("take") || undefined,
      skip: searchParams.get("skip") || undefined,
    });

    const products = await prisma.product.findMany({
      where: { organizationId: orgId },
      include: { bomItems: { include: { item: true } } },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });
    return NextResponse.json(products);
  } catch (err: any) {
    if (err.message && err.message.includes("NEXT_REDIRECT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handleApiError(err);
  }
}

export const POST = withPermission("products", "create", async (req: NextRequest, context: any, orgId: string) => {
  const body = await req.json();
  const data = productSchema.parse(body);

  const product = await prisma.product.create({
    data: {
      organizationId: orgId,
      name: data.name,
      sku: data.sku,
      unitPrice: data.unitPrice,
      description: data.description,
      bomItems: data.bomItems?.length
        ? {
            create: data.bomItems.map((b) => ({
              itemId: b.itemId,
              quantity: b.quantity,
              unit: b.unit ?? "pcs",
            })),
          }
        : undefined,
    },
    include: { bomItems: { include: { item: true } } },
  });
  return NextResponse.json(product, { status: 201 });
});
