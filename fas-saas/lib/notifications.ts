/**
 * lib/notifications.ts
 * Helper to enqueue notifications via BullMQ.
 * All notification sends go through this — NEVER send emails synchronously in a request handler.
 *
 * Usage:
 *   import { enqueueNotification } from "@/lib/notifications";
 *   await enqueueNotification({ type: "qc.failed", organizationId, recipientEmail, subject, body });
 */

export type NotificationType =
  | "machine.stopped"
  | "low.stock"
  | "wo.overdue"
  | "qc.failed"
  | "member.invite";

export interface NotificationPayload {
  type: NotificationType;
  organizationId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  meta?: Record<string, unknown>;
}

export async function enqueueNotification(payload: NotificationPayload): Promise<void> {
  // Dynamically import to avoid loading BullMQ/Redis in Edge runtime
  try {
    const { Queue } = await import("bullmq");
    const Redis = (await import("ioredis")).default;

    const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    const queue = new Queue("notifications", { connection: redis });

    await queue.add(payload.type, payload, {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    });

    await queue.close();
    redis.disconnect();
  } catch (err) {
    // Fail silently — notification failure should never break the main request
    console.error("[Notifications] Failed to enqueue:", payload.type, err);
  }
}

// ── Pre-built notification templates ───────────────────────────────────────────

export function machineStopped(orgId: string, email: string, machineName: string, plantName: string) {
  return enqueueNotification({
    type: "machine.stopped",
    organizationId: orgId,
    recipientEmail: email,
    subject: `[ALERT] Machine "${machineName}" has stopped`,
    body: `Machine <strong>${machineName}</strong> at <strong>${plantName}</strong> has unexpectedly stopped during a scheduled production window. Please investigate immediately.`,
  });
}

export function lowStock(orgId: string, email: string, itemName: string, qty: number, reorderPoint: number) {
  return enqueueNotification({
    type: "low.stock",
    organizationId: orgId,
    recipientEmail: email,
    subject: `[LOW STOCK] ${itemName} is below reorder point`,
    body: `Inventory item <strong>${itemName}</strong> is at ${qty} units, which is below the reorder point of ${reorderPoint}. Please raise a purchase order.`,
  });
}

export function qcFailed(orgId: string, email: string, inspectionId: string, plantName: string, defects: number) {
  return enqueueNotification({
    type: "qc.failed",
    organizationId: orgId,
    recipientEmail: email,
    subject: `[QC FAIL] Inspection failed at ${plantName}`,
    body: `A QC inspection at <strong>${plantName}</strong> has failed with <strong>${defects} defect(s)</strong> found. Inspection ID: ${inspectionId}. Please review and raise a non-conformance report.`,
  });
}

export function memberInvite(orgId: string, email: string, orgName: string, inviterName: string) {
  return enqueueNotification({
    type: "member.invite",
    organizationId: orgId,
    recipientEmail: email,
    subject: `You've been invited to ${orgName}`,
    body: `<strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on the Factory Management Platform. Sign in at your dashboard to accept.`,
  });
}
