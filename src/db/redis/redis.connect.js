import { createClient } from "redis";

export const redisClient = createClient({
  url: process.env.REDIS_URL,
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("connected to redis successfully");
  } catch (error) {
    console.log("failed to connect redis: ", error);
  }
};
