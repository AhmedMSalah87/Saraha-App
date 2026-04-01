import { Router } from "express";
import { getMessages, sendMessage } from "./message.service.js";
import { authMiddleware } from "../../common/middleware/auth.js";

export const messageRouter = Router({ mergeParams: true });

messageRouter.post("/", sendMessage);
messageRouter.get("/", authMiddleware, getMessages);
