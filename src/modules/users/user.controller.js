import { Router } from "express";
import { createUser, getProfile, signIn, updateUser } from "./user.service.js";
import { authMiddleware } from "../../common/middleware/auth.js";
import { sendMessage } from "../messages/message.service.js";
import { validate } from "../../common/middleware/validate.js";
import { signInSchema, signUpSchema } from "./user.validation.js";
import { upload } from "../../common/middleware/multer.js";
import { fileEnum } from "../../common/enums/user.enum.js";
upload;
export const userRouter = Router();

userRouter.post(
  "/signup",
  upload("users", fileEnum.image).fields([
    { name: "attachment", maxCount: 1 },
    { name: "attachments", maxCount: 2 },
  ]),
  createUser,
);
userRouter.post("/signin", validate(signInSchema), signIn);
userRouter.get("/profile/:id", authMiddleware, getProfile);
userRouter.patch("/profile", authMiddleware, updateUser);
userRouter.post("/:id/messages", sendMessage);
