import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

function createRedisClient(): Redis {
  const url = process.env.REDIS_URL;
  const client = url
    ? new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: true })
    : new Redis({ host: "localhost", port: 6379, maxRetriesPerRequest: 3, lazyConnect: true });
  client.on("error", (err) => { if (process.env.NODE_ENV !== "production") console.warn("[Redis]", err.message); });
  return client;
}

export const redis: Redis = globalForRedis.redis ?? createRedisClient();
if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

export async function getCache<T>(key: string): Promise<T | null> {
  try { const raw = await redis.get(key); return raw ? (JSON.parse(raw) as T) : null; } catch { return null; }
}
export async function setCache(key: string, value: unknown, ttlSeconds = 30): Promise<void> {
  try { await redis.set(key, JSON.stringify(value), "EX", ttlSeconds); } catch {}
}
export async function deleteCache(key: string): Promise<void> {
  try { await redis.del(key); } catch {}
}
export const cacheKeys = {
  dashboardStats: (orgId: string) => "dashboard:stats:" + orgId,
  machineStatus: (plantId: string) => "machines:status:" + plantId,
  qcSummary: (orgId: string) => "qc:summary:" + orgId,
};
