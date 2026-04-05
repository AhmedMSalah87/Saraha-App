import { Router } from "express";
import { getMessages, sendMessage } from "./message.service.js";
import { authMiddleware } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { messageSchema } from "./message.validation.js";

export const messageRouter = Router({ mergeParams: true });

messageRouter.post("/", validate(messageSchema), sendMessage);
messageRouter.get("/", authMiddleware, getMessages);
