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
  forgetPassword,
  resetPassword,
  resendOTP,
} from "./user.service.js";
import { authMiddleware } from "../../common/middleware/auth.js";
import { optionalAuth } from "../../common/middleware/optionalAuth.js";
import { validate } from "../../common/middleware/validate.js";
import {
  changePasswordSchema,
  profileSchema,
  signInSchema,
  signUpSchema,
} from "./user.validation.js";
import { uploadCloud } from "../../common/middleware/multer.js";
import { fileEnum } from "../../common/enums/user.enum.js";
import { messageRouter } from "../messages/message.controller.js";
import {
  emailLimiter,
  ipLimiter,
} from "../../common/middleware/rateLimiter.js";

export const userRouter = Router();

userRouter.use("/:id/messages", messageRouter); // any request go with this route should go to message router

userRouter.post("/signup", validate(signUpSchema), createUser);
userRouter.post("/verify-email", verifyEmail);
userRouter.post("/resend-otp", resendOTP);
userRouter.post(
  "/signin",
  ipLimiter,
  emailLimiter,
  validate(signInSchema),
  signIn,
);
userRouter.get(
  "/profile/:id",
  optionalAuth,
  validate(profileSchema),
  getProfile,
);

userRouter.get("/profile/:id/share", validate(profileSchema), shareProfileLink);
userRouter.patch("/profile", authMiddleware, updateUser);

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
userRouter.patch(
  "/password",
  authMiddleware,
  validate(changePasswordSchema),
  changePassword,
);
userRouter.post("/logout", authMiddleware, logout);
userRouter.patch("/forget-password", forgetPassword);
userRouter.patch("/reset-password", resetPassword);
