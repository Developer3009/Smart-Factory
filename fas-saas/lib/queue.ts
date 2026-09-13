import { Queue } from "bullmq";
import { redis } from "./redis";

// ─── Queue Instances ─────────────────────────────────────────────────────────
const connection = redis;

export const notificationQueue = new Queue("notifications", { connection });
export const alertQueue        = new Queue("alerts",        { connection });

// ─── Job Types ───────────────────────────────────────────────────────────────
export type NotificationJobData = {
  type: "machine.stopped" | "low.stock" | "wo.overdue" | "qc.failed" | "member.invite";
  organizationId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  meta?: Record<string, unknown>;
};

export async function enqueueNotification(data: NotificationJobData) {
  try {
    await notificationQueue.add(data.type, data, {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    });
  } catch (err) {
    console.error("[Queue] Failed to enqueue notification:", err);
  }
}
