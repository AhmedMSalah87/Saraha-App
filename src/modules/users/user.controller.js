import { Router } from "express";
import { createUser, getProfile, signIn, updateUser } from "./user.service.js";
import { authMiddleware } from "../../common/middleware/auth.js";
import { sendMessage } from "../messages/message.service.js";

export const userRouter = Router();

userRouter.post("/signup", createUser);
userRouter.post("/signin", signIn);
userRouter.get("/profile", authMiddleware, getProfile);
userRouter.patch("/profile", authMiddleware, updateUser);
userRouter.post("/:id/messages", sendMessage);
