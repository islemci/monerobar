import Redis from "ioredis";

// Redis client singleton for server-side usage in Next.js SSR
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redis = new Redis(redisUrl);

export default redis;
