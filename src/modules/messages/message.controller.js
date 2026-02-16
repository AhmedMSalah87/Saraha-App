import { Router } from "express";
import { getMessages } from "./message.service.js";
import { authMiddleware } from "../../common/middleware/auth.js";

export const messageRouter = Router();

messageRouter.get("/", authMiddleware, getMessages);
