/**
 * services/mqtt-ingester/index.ts — MQTT Machine Status Ingester
 * Topic: factory/{plantId}/machines/{machineId}/status
 * Payload: { machine_id, status: "ACTIVE"|"IDLE"|"STOPPED", timestamp }
 * Run: ts-node services/mqtt-ingester/index.ts
 */
import mqtt from "mqtt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BROKER_URL = process.env.MQTT_BROKER_URL ?? "mqtt://localhost:1883";
const TOPIC = "factory/+/machines/+/status";
const HEARTBEAT_TIMEOUT_MS = 90_000;

async function writeStatusLog(machineId: string, status: string, source = "MQTT") {
  try {
    await prisma.$transaction([
      prisma.machineStatusLog.create({ data: { machineId, status, source } }),
      prisma.machine.update({ where: { id: machineId }, data: { status, lastHeartbeatAt: new Date() } }),
    ]);
    console.log("[MQTT] Status update:", machineId, "->", status);
  } catch (err) {
    console.error("[MQTT] DB write failed:", err);
  }
}

const client = mqtt.connect(BROKER_URL);

client.on("connect", () => {
  console.log("[MQTT] Connected to broker:", BROKER_URL);
  client.subscribe(TOPIC, { qos: 1 }, (err) => {
    if (err) console.error("[MQTT] Subscribe error:", err);
    else console.log("[MQTT] Subscribed to:", TOPIC);
  });
});

client.on("message", async (topic: string, payload: Buffer) => {
  try {
    const data = JSON.parse(payload.toString());
    if (!data.machine_id || !data.status) return;
    const validStatuses = ["ACTIVE", "IDLE", "STOPPED"];
    if (!validStatuses.includes(data.status)) return;
    await writeStatusLog(data.machine_id, data.status, "MQTT");
  } catch (err) {
    console.error("[MQTT] Invalid payload on topic:", topic, err);
  }
});

client.on("error", (err: Error) => console.error("[MQTT] Connection error:", err));
client.on("reconnect", () => console.log("[MQTT] Reconnecting..."));

// Heartbeat checker — marks machines STOPPED if no message for 90s
setInterval(async () => {
  try {
    const threshold = new Date(Date.now() - HEARTBEAT_TIMEOUT_MS);
    const staleMachines = await prisma.machine.findMany({
      where: { isActive: true, status: { in: ["ACTIVE", "IDLE"] }, lastHeartbeatAt: { lt: threshold } },
    });
    for (const m of staleMachines) {
      console.log("[HEARTBEAT] Machine", m.name, "missed heartbeat — marking STOPPED");
      await writeStatusLog(m.id, "STOPPED", "HEARTBEAT");
    }
  } catch (err) {
    console.error("[HEARTBEAT] Check failed:", err);
  }
}, 30_000);

process.on("SIGINT", async () => {
  client.end();
  await prisma.$disconnect();
  process.exit(0);
});
