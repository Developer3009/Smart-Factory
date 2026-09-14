import { z } from 'zod';

export const organizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').trim(),
  plan: z.string().optional(),
});

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email').optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

export const vendorSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email').optional().nullable(),
  phone: z.string().optional().nullable(),
});

export const rawMaterialSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  sku: z.string().min(1, 'SKU is required').trim(),
  quantityOnHand: z.number().nonnegative().optional().default(0),
  reorderPoint: z.number().nonnegative().optional().default(0),
  unit: z.string().optional().default('pcs'),
  unitCost: z.number().nonnegative().optional().default(0),
});

export const memberSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  clerkUserId: z.string().min(1, 'Clerk User ID is required'),
  email: z.string().email().optional().nullable(),
  role: z.enum(['SAAS_ADMIN', 'ORG_ADMIN', 'MEMBER']).optional().default('MEMBER'),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  sku: z.string().min(1, 'SKU is required').trim(),
  price: z.number().nonnegative().optional(),
});

export const machineSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  type: z.string().min(1, 'Type is required').trim(),
  plantId: z.string().min(1, 'Plant ID is required'),
});

// Used across routes
export const idParamSchema = z.object({
  id: z.string().cuid('Invalid ID format'),
});

export const inventoryMovementSchema = z.object({
  quantity: z.number(),
  type: z.enum(["RECEIPT", "CONSUMPTION", "ADJUSTMENT"]),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const purchaseOrderSchema = z.object({
  vendorId: z.string().min(1),
  amount: z.number().nonnegative(),
  notes: z.string().optional().nullable(),
  expectedDelivery: z.string().optional().nullable(),
});

export const workOrderSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  dueDate: z.string().min(1),
  notes: z.string().optional().nullable(),
});

export const qcInspectionSchema = z.object({
  workOrderId: z.string().optional().nullable(),
  inspectionType: z.string().min(1),
  sampleSize: z.number().int().positive(),
  result: z.enum(["PASS", "FAIL", "CONDITIONAL"]).optional().nullable(),
  defectsFound: z.number().int().nonnegative(),
  notes: z.string().optional().nullable(),
});

export const shiftSchema = z.object({
  name: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
});

export const maintenanceTicketSchema = z.object({
  title: z.string().min(1),
  machineId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  type: z.string().optional().default("BREAKDOWN"),
  priority: z.string().optional().default("MEDIUM"),
});

export const salesOrderSchema = z.object({
  customerId: z.string().min(1),
  amount: z.number().nonnegative(),
});
