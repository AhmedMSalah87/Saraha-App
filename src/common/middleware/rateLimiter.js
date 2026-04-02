import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { getRemainingTime } from "../utils/getRemainingTime.js";

export const ipLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 100,
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

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    const remainingTime = getRemainingTime(req.rateLimit.resetTime);
    res
      .status(options.statusCode)
      .json({ message: `Too many attempts. Try again after ${remainingTime}` });
  },
  keyGenerator: (req) => {
    return `user:${req.user.id}`;
  },
});
