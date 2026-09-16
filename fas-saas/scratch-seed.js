const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function seed() {
  console.log("Seeding test data...");

  // 1. Create Organizations
  const orgA = await prisma.organization.upsert({
    where: { clerkOrgId: 'org_testA' },
    update: {},
    create: { clerkOrgId: 'org_testA', name: 'Test Org A', plan: 'ENTERPRISE' },
  });

  const orgB = await prisma.organization.upsert({
    where: { clerkOrgId: 'org_testB' },
    update: {},
    create: { clerkOrgId: 'org_testB', name: 'Test Org B', plan: 'STARTER' },
  });

  // Create Plants
  const plantA = await prisma.plant.upsert({
    where: { id: 'plant_testA' },
    update: {},
    create: { id: 'plant_testA', organizationId: orgA.id, name: 'Plant A' }
  }).catch(async () => {
    let p = await prisma.plant.findFirst({ where: { organizationId: orgA.id } });
    if (!p) p = await prisma.plant.create({ data: { organizationId: orgA.id, name: 'Plant A' }});
    return p;
  });

  const plantB = await prisma.plant.upsert({
    where: { id: 'plant_testB' },
    update: {},
    create: { id: 'plant_testB', organizationId: orgB.id, name: 'Plant B' }
  }).catch(async () => {
    let p = await prisma.plant.findFirst({ where: { organizationId: orgB.id } });
    if (!p) p = await prisma.plant.create({ data: { organizationId: orgB.id, name: 'Plant B' }});
    return p;
  });


  // 2. Ensure Roles Exist
  const roles = ['ADMIN', 'PLANT_MANAGER', 'SUPERVISOR', 'OPERATOR', 'VIEWER', 'CUSTOMER'];
  const roleMap = {};
  for (const name of roles) {
    let role = await prisma.role.findFirst({ where: { name, organizationId: null } });
    if (!role) {
      role = await prisma.role.create({
        data: { name, description: 'Test ' + name, isSystem: true },
      });
    }
    roleMap[name] = role;
  }

  // 3. Create Users for OrgA
  const testUsers = [
    { clerkId: 'user_adminA', name: 'Admin A', role: 'ADMIN' },
    { clerkId: 'user_pmA', name: 'PM A', role: 'PLANT_MANAGER' },
    { clerkId: 'user_supA', name: 'Sup A', role: 'SUPERVISOR' },
    { clerkId: 'user_opA', name: 'Op A', role: 'OPERATOR' },
    { clerkId: 'user_viewA', name: 'Viewer A', role: 'VIEWER' },
  ];

  for (const u of testUsers) {
    let orgUser = await prisma.orgUser.findFirst({ where: { clerkUserId: u.clerkId } });
    if (!orgUser) {
      orgUser = await prisma.orgUser.create({
        data: {
          clerkUserId: u.clerkId,
          organizationId: orgA.id,
          name: u.name,
          email: u.clerkId + '@test.com',
        }
      });
      await prisma.userFactoryRole.create({
        data: {
          userId: orgUser.id,
          roleId: roleMap[u.role].id,
          factoryId: plantA.id
        }
      });
    }
  }

  // Create a customer for CUSTOMER role
  let custRecord = await prisma.customer.findFirst({ where: { email: 'customerA@test.com' } });
  if (!custRecord) {
    custRecord = await prisma.customer.create({
      data: {
        organizationId: orgA.id,
        name: 'Test Customer A',
        email: 'customerA@test.com',
        phone: '1234567890'
      }
    });
  }

  let custUser = await prisma.orgUser.findFirst({ where: { clerkUserId: 'user_custA' } });
  if (!custUser) {
    custUser = await prisma.orgUser.create({
      data: {
        clerkUserId: 'user_custA',
        organizationId: orgA.id,
        name: 'Cust A',
        email: 'customerA@test.com',
        customerId: custRecord.id
      }
    });
    await prisma.userFactoryRole.create({
      data: {
        userId: custUser.id,
        roleId: roleMap['CUSTOMER'].id,
        factoryId: plantA.id
      }
    });
  }

  // 4. Create User for OrgB
  let adminB = await prisma.orgUser.findFirst({ where: { clerkUserId: 'user_adminB' } });
  if (!adminB) {
    adminB = await prisma.orgUser.create({
      data: { clerkUserId: 'user_adminB', organizationId: orgB.id, name: 'Admin B', email: 'adminB@test.com' }
    });
    await prisma.userFactoryRole.create({
      data: { userId: adminB.id, roleId: roleMap['ADMIN'].id, factoryId: plantB.id }
    });
  }

  console.log("Seeding complete.");
  const envData = { orgA: orgA.id, orgB: orgB.id, custRecord: custRecord.id, plantA: plantA.id, plantB: plantB.id };
  fs.writeFileSync('C:\\Users\\divye\\.gemini\\antigravity-ide\\brain\\dad2db81-ebca-4cd5-a392-0b545f2a43dd\\scratch\\tests\\env.json', JSON.stringify(envData));
}

seed().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
