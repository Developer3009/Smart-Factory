const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.orgUser.findFirst({
    include: { factoryRoles: { include: { role: true } } }
  });
  console.log("User:", user.id, user.organizationId, user.role);
  console.log("Factory Roles:", user.factoryRoles.map(fr => fr.role.name));

  const so = await prisma.salesOrder.findFirst({
    where: { organizationId: user.organizationId }
  });
  console.log("SO:", so?.id);

  const po = await prisma.purchaseOrder.findFirst({
    where: { organizationId: user.organizationId }
  });
  console.log("PO:", po?.id);
}
run().catch(console.error).finally(() => prisma.$disconnect());
