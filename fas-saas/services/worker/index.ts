/**
 * services/worker/index.ts — BullMQ Notification Worker
 * Processes notification jobs from Redis queue.
 * Run: ts-node services/worker/index.ts
 * Requires: REDIS_URL, RESEND_API_KEY env vars
 */
import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { Resend } from "resend";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", { maxRetriesPerRequest: null });
const resend = new Resend(process.env.RESEND_API_KEY);

const worker = new Worker(
  "notifications",
  async (job: Job) => {
    const { type, organizationId, recipientEmail, subject, body } = job.data;
    console.log("[Worker] Processing job:", type, "->", recipientEmail);

    const notification = await prisma.notification.create({
      data: {
        organizationId,
        recipientEmail,
        type,
        channel: "EMAIL",
        subject,
        body,
        status: "QUEUED",
        jobId: job.id ?? null,
      },
    });

    try {
      await resend.emails.send({
        from: process.env.FROM_EMAIL ?? "noreply@factory.com",
        to: recipientEmail,
        subject: subject,
        html: `
          <div style="font-family:Inter,sans-serif;padding:24px;max-width:600px;margin:0 auto">
            <h2 style="color:#6366f1">${subject}</h2>
            <p style="color:#374151;line-height:1.6">${body}</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
            <p style="color:#9ca3af;font-size:12px">Factory Management SaaS — Automated Alert</p>
          </div>
        `,
      });

      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: "SENT", sentAt: new Date() },
      });
      console.log("[Worker] Email sent:", recipientEmail);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: "FAILED", failureReason: message },
      });
      throw err;
    }
  },
  { connection: redis, concurrency: 5 }
);

worker.on("completed", (job: Job) => console.log("[Worker] Job completed:", job.id));
worker.on("failed", (job: Job | undefined, err: Error) =>
  console.error("[Worker] Job failed:", job?.id, err.message)
);

console.log("[Worker] BullMQ notification worker started");

process.on("SIGINT", async () => {
  await worker.close();
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});
