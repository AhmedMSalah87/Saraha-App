import { Router } from "express";
import {
  createUser,
  getProfile,
  useRefreshToken,
  signIn,
  updateUser,
  uploadPhoto,
  deleteProfileImage,
  shareProfileLink,
  changePassword,
  logout,
  verifyEmail,
} from "./user.service.js";
import { authMiddleware } from "../../common/middleware/auth.js";
import { optionalAuth } from "../../common/middleware/optionalAuth.js";
import { sendMessage } from "../messages/message.service.js";
import { validate } from "../../common/middleware/validate.js";
import {
  profileSchema,
  signInSchema,
  signUpSchema,
} from "./user.validation.js";
import { uploadCloud } from "../../common/middleware/multer.js";
import { fileEnum } from "../../common/enums/user.enum.js";

export const userRouter = Router();

userRouter.post("/signup", validate(signUpSchema), createUser);
userRouter.post("/emailVerification", verifyEmail);
userRouter.post("/signin", validate(signInSchema), signIn);
userRouter.get(
  "/profile/:id",
  optionalAuth,
  validate(profileSchema),
  getProfile,
);

userRouter.get("/profile/:id/share", validate(profileSchema), shareProfileLink);
userRouter.patch("/profile", authMiddleware, updateUser);
userRouter.post("/:id/messages", sendMessage);
userRouter.post("/refreshToken", useRefreshToken);
userRouter.post(
  "/upload",
  authMiddleware,
  uploadCloud(fileEnum.image).fields([
    { name: "avatar", maxCount: 1 },
    { name: "gallery", maxCount: 5 },
  ]),
  uploadPhoto,
);
userRouter.delete("/profileImage", authMiddleware, deleteProfileImage);
userRouter.patch("/password", authMiddleware, changePassword);
userRouter.post("/logout", authMiddleware, logout);
