import { PrismaClient } from "@prisma/client";

// Ensure DATABASE_URL is set for local dev
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./dev.db";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Factory Management System demo data...");

  // ── Organization ──
  const org = await prisma.organization.upsert({
    where: { id: "demo-org-1" },
    update: {},
    create: {
      id: "demo-org-1",
      name: "Apex Manufacturing Pvt. Ltd.",
      plan: "PRO",
    },
  });
  console.log("✅ Organization:", org.name);

  // ── Plant ──
  const plant = await prisma.plant.upsert({
    where: { id: "plant-1" },
    update: {},
    create: {
      id: "plant-1",
      organizationId: org.id,
      name: "Main Production Plant",
      location: "Mumbai, Maharashtra",
    },
  });
  console.log("✅ Plant:", plant.name);

  // ── Machines ──
  const machineData = [
    { id: "m1",  name: "CNC Lathe #1",       description: "Heavy-duty CNC turning center",   machineType: "CNC",        status: "RUNNING" },
    { id: "m2",  name: "CNC Lathe #2",       description: "Secondary turning center",         machineType: "CNC",        status: "IDLE"    },
    { id: "m3",  name: "Ww Press",           description: "Hydraulic press 200T",             machineType: "Press",      status: "RUNNING" },
    { id: "m4",  name: "Jatin Grinder",      description: "He is a good boy",                 machineType: "Good",       status: "RUNNING" },
    { id: "m5",  name: "ANjali Mill",        description: "Vertical milling machine",          machineType: "type1",      status: "IDLE"    },
    { id: "m6",  name: "Neeraj Drill",       description: "Radial drill press",               machineType: "Drill",      status: "RUNNING" },
    { id: "m7",  name: "Assembly Line A",    description: "Primary assembly station",          machineType: "Assembly",   status: "RUNNING" },
    { id: "m8",  name: "Packaging Unit #1",  description: "Automated packaging machine",       machineType: "Packaging",  status: "DOWN"    },
    { id: "m9",  name: "Welding Station #1", description: "MIG welding robot",                machineType: "Welding",    status: "IDLE"    },
    { id: "m10", name: "Injection Molder",   description: "Plastic injection mold press",      machineType: "Molding",    status: "RUNNING" },
    { id: "m11", name: "Conveyor Belt A",    description: "Main production conveyor",          machineType: "Conveyor",   status: "RUNNING" },
    { id: "m12", name: "Heat Treatment #1",  description: "Furnace for metal treatment",       machineType: "Furnace",    status: "IDLE"    },
    { id: "m13", name: "Quality Scanner",    description: "Optical quality inspection system", machineType: "Inspection", status: "RUNNING" },
    { id: "m14", name: "Cutting Machine A",  description: "Laser cutter 500W",                machineType: "Laser",      status: "RUNNING" },
    { id: "m15", name: "Press Brake #1",     description: "Sheet metal press brake",           machineType: "Press",      status: "IDLE"    },
    { id: "m16", name: "Test Unit",          description: "Final testing station",              machineType: "Testing",    status: "RUNNING" },
  ];

  for (const m of machineData) {
    await prisma.machine.upsert({
      where: { id: m.id },
      update: { status: m.status },
      create: { ...m, organizationId: org.id, plantId: plant.id },
    });
  }
  console.log(`✅ ${machineData.length} machines seeded`);

  // ── Users ──
  const users = [
    { id: "user-1", name: "Admin User",   role: "ADMIN",         email: "admin@apex.com"  },
    { id: "user-2", name: "Neeraj Kumar", role: "PLANT_MANAGER", email: "neeraj@apex.com" },
    { id: "user-3", name: "Jatin Sharma", role: "SUPERVISOR",    email: "jatin@apex.com"  },
    { id: "user-4", name: "ANjali Singh", role: "OPERATOR",      email: "anjali@apex.com" },
    { id: "user-5", name: "Weel Patel",   role: "OPERATOR",      email: "weel@apex.com"   },
    { id: "user-6", name: "Ravi Gupta",   role: "OPERATOR",      email: "ravi@apex.com"   },
    { id: "user-7", name: "Priya Mehta",  role: "SUPERVISOR",    email: "priya@apex.com"  },
  ];

  for (const u of users) {
    await prisma.orgUser.upsert({
      where: { id: u.id },
      update: {},
      create: { ...u, organizationId: org.id, clerkUserId: u.id },
    });
  }
  console.log(`✅ ${users.length} users seeded`);

  // ── Customers ──
  const customerData = [
    { id: "cust-1", name: "Reliance Industries",  email: "procurement@reliance.com", phone: "+91-22-1234-5678" },
    { id: "cust-2", name: "Tata Motors Ltd",       email: "orders@tatamotors.com",    phone: "+91-22-2345-6789" },
    { id: "cust-3", name: "Mahindra & Mahindra",   email: "supply@mahindra.com",      phone: "+91-22-3456-7890" },
    { id: "cust-4", name: "Bajaj Auto Ltd",        email: "logistics@bajaj.com",      phone: "+91-20-4567-8901" },
  ];

  for (const c of customerData) {
    await prisma.customer.upsert({
      where: { id: c.id }, update: {},
      create: { ...c, organizationId: org.id },
    });
  }
  console.log(`✅ ${customerData.length} customers seeded`);

  // ── Vendors ──
  const vendorData = [
    { id: "vendor-1", name: "Steel Corp India",    email: "sales@steelcorp.in"    },
    { id: "vendor-2", name: "Plastic Pro Pvt Ltd", email: "info@plasticpro.in"    },
    { id: "vendor-3", name: "Chem Solutions",      email: "orders@chemsol.in"     },
    { id: "vendor-4", name: "Metal Works India",   email: "supply@metalworks.in"  },
  ];

  for (const v of vendorData) {
    await prisma.vendor.upsert({
      where: { id: v.id }, update: {},
      create: { ...v, organizationId: org.id },
    });
  }
  console.log(`✅ ${vendorData.length} vendors seeded`);

  // ── Products ──
  const productData = [
    { id: "prod-1",  name: "Basmati Rice 25kg",   sku: "BR-25KG",    unitPrice: 1200, description: "Premium basmati rice bag"           },
    { id: "prod-2",  name: "Soap Bar (Bulk)",      sku: "SOAP-BLK",   unitPrice: 45,   description: "Industrial grade soap bar"           },
    { id: "prod-3",  name: "Steel Shaft 50mm",     sku: "SS-50MM",    unitPrice: 850,  description: "Precision machined steel shaft"      },
    { id: "prod-4",  name: "Weel Assembly",        sku: "WA-001",     unitPrice: 3200, description: "Complete wheel assembly unit"         },
    { id: "prod-5",  name: "Plastic Housing A",    sku: "PHA-001",    unitPrice: 280,  description: "Injection molded housing part"       },
    { id: "prod-6",  name: "Gear Set Type-B",      sku: "GS-TYPE-B",  unitPrice: 1850, description: "Precision gear set for transmission" },
    { id: "prod-7",  name: "Valve Body 2-inch",    sku: "VB-2IN",     unitPrice: 620,  description: "CNC machined valve body"             },
    { id: "prod-8",  name: "Bracket Assembly #3",  sku: "BA-003",     unitPrice: 420,  description: "Welded steel bracket"                },
    { id: "prod-9",  name: "Conveyor Roller",      sku: "CR-001",     unitPrice: 380,  description: "Industrial conveyor roller"          },
    { id: "prod-10", name: "Pump Impeller 4in",    sku: "PI-4IN",     unitPrice: 2100, description: "Centrifugal pump impeller"           },
    { id: "prod-11", name: "Filter Housing",       sku: "FH-001",     unitPrice: 750,  description: "Aluminum filter housing"             },
  ];

  for (const p of productData) {
    await prisma.product.upsert({
      where: { id: p.id }, update: {},
      create: { ...p, organizationId: org.id },
    });
  }
  console.log(`✅ ${productData.length} products seeded`);

  // ── Inventory Items ──
  const inventoryData = [
    { id: "inv-1",  sku: "RM-STEEL-001",   name: "Steel Rod 25mm",          type: "RAW_MATERIAL",  quantityOnHand: 500,  reorderPoint: 100, unit: "kg",    unitCost: 75   },
    { id: "inv-2",  sku: "RM-STEEL-002",   name: "Steel Sheet 3mm",         type: "RAW_MATERIAL",  quantityOnHand: 200,  reorderPoint: 50,  unit: "sheet", unitCost: 420  },
    { id: "inv-3",  sku: "RM-PLASTIC-001", name: "HDPE Granules",           type: "RAW_MATERIAL",  quantityOnHand: 800,  reorderPoint: 200, unit: "kg",    unitCost: 120  },
    { id: "inv-4",  sku: "RM-ALUM-001",    name: "Aluminum Billet 6061",    type: "RAW_MATERIAL",  quantityOnHand: 150,  reorderPoint: 50,  unit: "kg",    unitCost: 350  },
    { id: "inv-5",  sku: "RM-CHEM-001",    name: "Cutting Oil (20L)",       type: "RAW_MATERIAL",  quantityOnHand: 25,   reorderPoint: 10,  unit: "can",   unitCost: 680  },
    { id: "inv-6",  sku: "RM-PACK-001",    name: "Cardboard Box 40x30",     type: "RAW_MATERIAL",  quantityOnHand: 5,    reorderPoint: 100, unit: "pcs",   unitCost: 18   },
    { id: "inv-7",  sku: "RM-BOLT-001",    name: "M10 Bolts (Box of 100)",  type: "RAW_MATERIAL",  quantityOnHand: 2000, reorderPoint: 500, unit: "pcs",   unitCost: 2    },
    { id: "inv-8",  sku: "FG-BR-25KG",     name: "Basmati Rice 25kg (FG)",  type: "FINISHED_GOOD", quantityOnHand: 120,  reorderPoint: 20,  unit: "bag",   unitCost: 1200 },
    { id: "inv-9",  sku: "FG-SOAP-BLK",    name: "Soap Bar Bulk (FG)",      type: "FINISHED_GOOD", quantityOnHand: 3500, reorderPoint: 500, unit: "pcs",   unitCost: 45   },
    { id: "inv-10", sku: "FG-SS-50MM",     name: "Steel Shaft 50mm (FG)",   type: "FINISHED_GOOD", quantityOnHand: 45,   reorderPoint: 10,  unit: "pcs",   unitCost: 850  },
    { id: "inv-11", sku: "FG-WA-001",      name: "Weel Assembly (FG)",      type: "FINISHED_GOOD", quantityOnHand: 12,   reorderPoint: 5,   unit: "pcs",   unitCost: 3200 },
    { id: "inv-12", sku: "FG-GS-TYPE-B",   name: "Gear Set Type-B (FG)",    type: "FINISHED_GOOD", quantityOnHand: 8,    reorderPoint: 5,   unit: "set",   unitCost: 1850 },
    { id: "inv-13", sku: "FG-VB-2IN",      name: "Valve Body 2-inch (FG)",  type: "FINISHED_GOOD", quantityOnHand: 30,   reorderPoint: 10,  unit: "pcs",   unitCost: 620  },
    { id: "inv-14", sku: "FG-BA-003",      name: "Bracket Assembly #3 (FG)",type: "FINISHED_GOOD", quantityOnHand: 55,   reorderPoint: 15,  unit: "pcs",   unitCost: 420  },
    { id: "inv-15", sku: "FG-CR-001",      name: "Conveyor Roller (FG)",    type: "FINISHED_GOOD", quantityOnHand: 22,   reorderPoint: 8,   unit: "pcs",   unitCost: 380  },
    { id: "inv-16", sku: "FG-PI-4IN",      name: "Pump Impeller 4in (FG)",  type: "FINISHED_GOOD", quantityOnHand: 6,    reorderPoint: 5,   unit: "pcs",   unitCost: 2100 },
    { id: "inv-17", sku: "FG-FH-001",      name: "Filter Housing (FG)",     type: "FINISHED_GOOD", quantityOnHand: 18,   reorderPoint: 5,   unit: "pcs",   unitCost: 750  },
    { id: "inv-18", sku: "FG-PHA-001",     name: "Plastic Housing A (FG)",  type: "FINISHED_GOOD", quantityOnHand: 200,  reorderPoint: 50,  unit: "pcs",   unitCost: 280  },
  ];

  for (const item of inventoryData) {
    await prisma.inventoryItem.upsert({
      where: { id: item.id },
      update: { quantityOnHand: item.quantityOnHand },
      create: { ...item, organizationId: org.id, plantId: plant.id },
    });
  }
  console.log(`✅ ${inventoryData.length} inventory items seeded`);

  // ── Work Orders ──
  const now = new Date();
  const d = (offset: number) => new Date(now.getTime() + offset * 24 * 60 * 60 * 1000);

  const workOrderData = [
    { id: "wo-1",  productId: "prod-2",  quantity: 455, estimatedHrs: 12.45, status: "IN_PROGRESS", dueDate: d(5)   },
    { id: "wo-2",  productId: "prod-1",  quantity: 20,  estimatedHrs: 11.5,  status: "QUEUED",      dueDate: d(10)  },
    { id: "wo-3",  productId: "prod-1",  quantity: 50,  estimatedHrs: 10.0,  status: "COMPLETED",   dueDate: d(-5)  },
    { id: "wo-4",  productId: "prod-1",  quantity: 1,   estimatedHrs: 5.0,   status: "IN_PROGRESS", dueDate: d(2)   },
    { id: "wo-5",  productId: "prod-4",  quantity: 10,  estimatedHrs: 10.0,  status: "COMPLETED",   dueDate: d(-20) },
    { id: "wo-6",  productId: "prod-1",  quantity: 1,   estimatedHrs: 12.37, status: "COMPLETED",   dueDate: d(-22) },
    { id: "wo-7",  productId: "prod-1",  quantity: 55,  estimatedHrs: 10.50, status: "COMPLETED",   dueDate: d(-25) },
    { id: "wo-8",  productId: "prod-2",  quantity: 10,  estimatedHrs: 10.10, status: "COMPLETED",   dueDate: d(-30) },
    { id: "wo-9",  productId: "prod-3",  quantity: 25,  estimatedHrs: 8.0,   status: "QUEUED",      dueDate: d(15)  },
    { id: "wo-10", productId: "prod-6",  quantity: 5,   estimatedHrs: 16.0,  status: "IN_PROGRESS", dueDate: d(7)   },
    { id: "wo-11", productId: "prod-7",  quantity: 30,  estimatedHrs: 6.5,   status: "COMPLETED",   dueDate: d(-10) },
    { id: "wo-12", productId: "prod-5",  quantity: 100, estimatedHrs: 4.0,   status: "QUEUED",      dueDate: d(20)  },
  ];

  for (const wo of workOrderData) {
    await prisma.workOrder.upsert({
      where: { id: wo.id },
      update: { status: wo.status },
      create: { ...wo, organizationId: org.id, plantId: plant.id },
    });
  }
  console.log(`✅ ${workOrderData.length} work orders seeded`);

  // ── Downtime Reason Codes ──
  const downtimeCodes = [
    { id: "dtc-1", code: "MECH",  description: "Mechanical Failure"   },
    { id: "dtc-2", code: "ELEC",  description: "Electrical Failure"   },
    { id: "dtc-3", code: "SETUP", description: "Setup / Changeover"   },
    { id: "dtc-4", code: "PM",    description: "Planned Maintenance"  },
    { id: "dtc-5", code: "MAT",   description: "Material Shortage"    },
    { id: "dtc-6", code: "OPS",   description: "Operator Absence"     },
  ];

  for (const dtc of downtimeCodes) {
    await prisma.downtimeReasonCode.upsert({
      where: { id: dtc.id }, update: {},
      create: { ...dtc, organizationId: org.id },
    });
  }
  console.log(`✅ ${downtimeCodes.length} downtime reason codes seeded`);

  // ── Sales Orders (for profit calculation) ──
  const salesOrderData: any[] = [
    { id: "so-1", customerId: "cust-1", amount: 12500, status: "COMPLETED" },
    { id: "so-2", customerId: "cust-2", amount: 28000, status: "COMPLETED" },
    { id: "so-3", customerId: "cust-1", amount: 8500,  status: "COMPLETED" },
    { id: "so-4", customerId: "cust-3", amount: 15000, status: "PENDING"   },
    { id: "so-5", customerId: "cust-4", amount: 9000,  status: "COMPLETED" },
  ];

  for (const so of salesOrderData) {
    await prisma.salesOrder.upsert({
      where: { id: so.id }, update: {},
      create: so,
    });
  }
  console.log(`✅ ${salesOrderData.length} sales orders seeded`);

  const totalProfit = salesOrderData.filter(s => s.status === "COMPLETED").reduce((sum, s) => sum + s.amount, 0);
  console.log(`\n🎉 Seeding complete! Factory Management System is ready.`);
  console.log(`   Org: Apex Manufacturing Pvt. Ltd. | Plan: PRO`);
  console.log(`   Machines: ${machineData.length} | Products: ${productData.length} | Work Orders: ${workOrderData.length}`);
  console.log(`   Inventory: ${inventoryData.length} | Customers: ${customerData.length} | Total Profit: ₹${(totalProfit/1000).toFixed(0)}K`);
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(async () => await prisma.$disconnect());
