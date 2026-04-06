import { redisClient } from "./redis.connect.js";

export const redisRepository = {
  async setCache(key, value, tllSeconds = null) {
    try {
      const val = typeof value === "object" ? JSON.stringify(value) : value;
      if (tllSeconds) {
        await redisClient.set(key, val, {
          expiration: {
            type: "EX",
            value: tllSeconds,
          },
        });
      } else {
        await redisClient.set(key, val);
      }
    } catch (err) {
      console.error(`Redis SET error for key ${key}:`, err);
      throw err;
    }
  },

  async getCache(key) {
    try {
      const value = await redisClient.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch {
        return value; // if value is primitive, json.parse throw error as value not json string so it is better to return primitive value itself
      }
    } catch (err) {
      console.error(`Redis GET error for key ${key}:`, err);
      throw err;
    }
  },

  async deleteCache(...keys) {
    try {
      await redisClient.del(keys);
    } catch (err) {
      console.error(`Redis DEL error for key ${keys}:`, err);
      throw err;
    }
  },

  async cacheTTL(key) {
    try {
      const ttl = await redisClient.ttl(key);
      return ttl;
    } catch (err) {
      console.error(`Redis TTL error for key ${key}:`, err);
      throw err;
    }
  },

  async increment(key) {
    try {
      const value = await redisClient.incr(key);
      return value;
    } catch (err) {
      console.error(`Redis INCR error for key ${key}:`, err);
      throw err;
    }
  },

  async expireCache(key, ttlSeconds) {
    try {
      await redisClient.expire(key, ttlSeconds);
    } catch (err) {
      console.error(`Redis expire error for key ${key}:`, err);
      throw err;
    }
  },
};
