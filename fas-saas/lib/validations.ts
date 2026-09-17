import { z } from "zod";

export const paginationSchema = z.object({
  take: z.coerce.number().min(1).max(100).default(50),
  skip: z.coerce.number().min(0).default(0),
});

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

export const memberSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  clerkUserId: z.string().min(1, 'Clerk User ID is required'),
  email: z.string().email().optional().nullable(),
  role: z.enum(['SAAS_ADMIN', 'ORG_ADMIN', 'MEMBER']).optional().default('MEMBER'),
});

export const rawMaterialSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  sku: z.string().min(1, 'SKU is required').trim(),
  quantityOnHand: z.number().nonnegative().optional().default(0),
  reorderPoint: z.number().nonnegative().optional().default(0),
  unit: z.string().optional().default('pcs'),
  unitCost: z.number().nonnegative().optional().default(0),
});

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  description: z.string().optional().nullable(),
  unitPrice: z.number().min(0).default(0),
  bomItems: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().min(0.01),
    unit: z.string().optional()
  })).optional()
});

export const vendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(5, "Valid phone required")
});

export const salesOrderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  status: z.enum(["PENDING", "CONFIRMED", "IN_PRODUCTION", "DISPATCHED", "DELIVERED", "DECLINED", "CANCELLED"]).optional()
});

export const machineSchema = z.object({
  plantId: z.string().min(1, "Plant ID is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  machineType: z.string().optional(),
  protocol: z.string().optional(),
  ipAddress: z.string().optional().nullable()
});

export const inventorySchema = z.object({
  plantId: z.string().optional().nullable(),
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  type: z.string().optional(),
  quantityOnHand: z.number().min(0).default(0),
  reorderPoint: z.number().min(0).default(0),
  unit: z.string().default("pcs"),
  unitCost: z.number().min(0).default(0)
});

export const workOrderSchema = z.object({
  plantId: z.string().min(1, "Plant ID is required"),
  productId: z.string().min(1, "Product ID is required"),
  shiftId: z.string().optional().nullable(),
  quantity: z.number().min(1),
  targetQty: z.number().optional().nullable(),
  dueDate: z.string().datetime(),
  estimatedHrs: z.number().optional().nullable(),
  notes: z.string().optional().nullable()
});

