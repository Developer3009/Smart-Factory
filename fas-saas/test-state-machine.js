const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const cust = await prisma.customer.findFirst({
    include: { organization: true }
  });
  
  const so = await prisma.salesOrder.create({
    data: {
      customerId: cust.id,
      amount: 50,
      status: "PENDING"
    }
  });

  const orgId = cust.organizationId;
  const user = await prisma.orgUser.findFirst({
    where: { organizationId: orgId }
  });

  const clerkOrgId = cust.organization.clerkOrgId;

  console.log("Created SO:", so.id, "Current Status: PENDING");
  
  // Invalid jump: PENDING -> DELIVERED
  let res = await fetch(`http://localhost:3000/api/sales-orders/${so.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-test-user-id": user.clerkUserId,
      "x-test-org": clerkOrgId
    },
    body: JSON.stringify({ status: "DELIVERED" })
  });

  console.log("Attempt PENDING -> DELIVERED. Status:", res.status);
  let data = await res.json();
  console.log("Response:", data);

  // Valid jump: PENDING -> CONFIRMED
  res = await fetch(`http://localhost:3000/api/sales-orders/${so.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-test-user-id": user.clerkUserId,
      "x-test-org": clerkOrgId
    },
    body: JSON.stringify({ status: "CONFIRMED" })
  });

  console.log("Attempt PENDING -> CONFIRMED. Status:", res.status);
  data = await res.json();
  console.log("Response:", data.status);

  // Valid jump: CONFIRMED -> IN_PRODUCTION
  res = await fetch(`http://localhost:3000/api/sales-orders/${so.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-test-user-id": user.clerkUserId,
      "x-test-org": clerkOrgId
    },
    body: JSON.stringify({ status: "IN_PRODUCTION" })
  });

  console.log("Attempt CONFIRMED -> IN_PRODUCTION. Status:", res.status);
  data = await res.json();
  console.log("Response:", data.status);
}
run().catch(console.error).finally(() => prisma.$disconnect());
