import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (!id || (action !== "confirm" && action !== "decline")) {
      return new NextResponse("Invalid request", { status: 400 });
    }

    const newStatus = action === "confirm" ? "APPROVED" : "CANCELLED";

    const order = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: newStatus },
      include: { vendor: true },
    });

    const isConfirm = action === "confirm";
    
    // Return a simple HTML response for the vendor
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order ${isConfirm ? 'Confirmed' : 'Declined'}</title>
        <style>
          body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f3f4f6; }
          .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); text-align: center; max-width: 400px; }
          .icon { font-size: 48px; margin-bottom: 16px; }
          .title { font-size: 24px; font-weight: bold; color: #111827; margin-bottom: 8px; }
          .message { color: #6b7280; line-height: 1.5; margin-bottom: 24px; }
          .btn { display: inline-block; padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">${isConfirm ? '✅' : '❌'}</div>
          <div class="title">Order ${isConfirm ? 'Confirmed' : 'Declined'}</div>
          <div class="message">
            Thank you, <strong>${order.vendor.name}</strong>.<br>
            The purchase order for ₹${order.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} has been <strong>${newStatus.toLowerCase()}</strong>.
          </div>
          <p style="font-size: 14px; color: #9ca3af;">You may now close this window.</p>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (err: any) {
    console.error("Vendor order update failed:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
