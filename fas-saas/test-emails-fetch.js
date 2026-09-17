const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const so = await prisma.salesOrder.findFirst({
    include: { customer: true }
  });

  const orgId = so.customer.organizationId;
  const user = await prisma.orgUser.findFirst({
    where: { organizationId: orgId }
  });

  console.log("Triggering API for SO:", so.id, "as user:", user.id, "org:", orgId);
  
  const res = await fetch(`http://localhost:3000/api/sales-orders/${so.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-test-user-id": user.id,
      "x-test-org": orgId
    },
    body: JSON.stringify({ status: "CONFIRMED" })
  });

  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Response:", data);

  const logs = await prisma.emailLog.findMany({
    where: { orderId: so.id }
  });
  console.log("Email Logs:", logs);
}
run().catch(console.error).finally(() => prisma.$disconnect());
