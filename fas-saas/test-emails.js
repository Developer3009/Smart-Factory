const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Setup mock for TS transpilation in JS
require('ts-node').register();
const { sendSalesOrderEmail } = require('./lib/email.ts');

async function run() {
  const admin = await prisma.orgUser.findFirst({
    where: { role: 'ADMIN' },
    include: { organization: true }
  });

  const so = await prisma.salesOrder.findFirst({
    where: { customer: { organizationId: admin.organizationId } },
    include: { customer: true }
  });

  console.log("Triggering email for SO:", so.id);
  await sendSalesOrderEmail(so, so.customer, "CONFIRMED");

  const logs = await prisma.emailLog.findMany({
    where: { orderId: so.id }
  });

  console.log("Email Logs created:", logs);
}
run().catch(console.error).finally(() => prisma.$disconnect());
