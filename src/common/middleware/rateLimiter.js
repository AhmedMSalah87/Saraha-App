import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { getRemainingTime } from "../utils/getRemainingTime.js";

export const appLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({ message: options.message });
  },
});

export const ipLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 100,
  message: "Too many login attempts from that IP address",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({ message: options.message });
  },
  keyGenerator: (req) => {
    return ipKeyGenerator(req.ip);
  },
});

export const emailLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  message: "Too many login attempts. try again later",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    const remainingTime = getRemainingTime(req.rateLimit.resetTime);
    res
      .status(options.statusCode)
      .json({ message: `Too many attempts. Try again after ${remainingTime}` });
  },
  keyGenerator: (req) => {
    return req.body?.email || ipKeyGenerator(req.ip);
  },
});
