import { DatabaseRepository } from "../../db/db.repository.js";
import { userModel } from "../../db/models/user.model.js";
import { randomUUID } from "node:crypto";
import { profileViewsModel } from "../../db/models/profileViews.model.js";
import { hashValue, matchValue } from "../../common/utils/security/hash.js";
import jwt from "jsonwebtoken";
import cloudinary, {
  uploadToCloudinary,
} from "../../common/utils/cloudinary.js";
import { tokenModel } from "../../db/models/token.model.js";
import { sendEmailVerification } from "../../common/utils/sendEmail.js";
import { generateOTP } from "../../common/utils/generateOTP.js";
import { redisRepository } from "../../db/redis/redis.repository.js";
import { providerEnum, userEvents } from "../../common/enums/user.enum.js";
import {
  AuthError,
  NotFoundError,
  DuplicateEntryError,
  ValidationError,
} from "../../errors/appErrors.js";
import { eventEmitter } from "../../common/utils/emailEvent.js";
import { getRemainingTime } from "../../common/utils/getRemainingTime.js";

export const userRepo = new DatabaseRepository(userModel);
const profileViewRepo = new DatabaseRepository(profileViewsModel);

export const createUser = async (req, res, next) => {
  const { firstName, lastName, email, password, gender } = req.body;

  const existingUser = await userRepo.findOne({ email });
  if (existingUser) {
    return next(new DuplicateEntryError(email));
  }
  const hashedPassword = await hashValue(password);
  await userRepo.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    gender,
    isVerified: false,
  });

  const otp = generateOTP();
  const hashedOTP = await hashValue(otp);

  eventEmitter.emit(userEvents.confirmEmail, async () => {
    await redisRepository.setCache(`otp:${email}`, hashedOTP, 600);
    await sendEmailVerification(email, otp);
    await redisRepository.setCache(`otp:${email}:max_attempts`, 1);
  });

  res.status(201).json({
    message: "User created successfully. Verification OTP sent to email.",
  });
};

export const resendOTP = async (req, res, next) => {
  const { email } = req.body;
  const user = await userRepo.findOne({
    email,
    isVerified: false,
    provider: providerEnum.system,
  });

  if (!user) {
    return next(new NotFoundError("user"));
  }

  const isBlocked = await redisRepository.getCache(`otp:${email}:blocked`);
  if (isBlocked) {
    return next(
      new AuthError(
        "you are blocked. Please wait for 30 minutes to resend new OTP",
      ),
    );
  }

  const otpTTL = await redisRepository.cacheTTL(`otp:${email}`);
  if (otpTTL > 0) {
    return next(
      new AuthError(
        `please wait ${otpTTL > 60 ? Math.ceil(otpTTL / 60) : otpTTL} ${otpTTL > 60 ? "minutes" : "seconds"} until sending new OTP`,
      ),
    );
  }
  const otpMaxAttempts = await redisRepository.getCache(
    `otp:${email}:max_attempts`,
  );

  if (otpMaxAttempts >= 5) {
    await redisRepository.setCache(`otp:${email}:blocked`, 1, 1800);
    await redisRepository.expireCache(`otp:${email}:max_attempts`, 1800);
    return next(
      new AuthError(
        "you exceeded 5 attempts of sending OTP. Please wait for 30 minutes to resend new OTP",
      ),
    );
  }

  const otp = generateOTP();
  const hashedOTP = await hashValue(otp);

  eventEmitter.emit(userEvents.confirmEmail, async () => {
    await redisRepository.setCache(`otp:${email}`, hashedOTP, 600);
    await sendEmailVerification(email, otp);
    await redisRepository.increment(`otp:${email}:max_attempts`);
  });

  res.status(200).json({ message: "Verification OTP sent to email" });
};

export const verifyEmail = async (req, res, next) => {
  const { email, otp } = req.body;
  const existingUser = await userRepo.findOne({
    email,
    isVerified: false,
    provider: providerEnum.system,
  });

  if (!existingUser) {
    return next(new NotFoundError("user"));
  }
  const hashedOTP = await redisRepository.getCache(`otp:${email}`);

  if (!hashedOTP) {
    return next(new AuthError("OTP has expired", "OTP_EXPIRED"));
  }

  const isMatched = await matchValue(otp, hashedOTP);

  if (!isMatched) {
    return next(new ValidationError("Invalid OTP"));
  }

  existingUser.isVerified = true;
  await existingUser.save();

  await redisRepository.deleteCache(`otp:${email}`);
  await redisRepository.deleteCache(`otp:${email}:max_attempts`);

  res.status(200).json({ message: "email verified successfully" });
};

export const uploadPhoto = async (req, res, next) => {
  const userId = req.user?._id;
  if (!req.files) {
    return next(new ValidationError("photos are required"));
  }

  const { public_id, secure_url } = await uploadToCloudinary(
    "users",
    req.files.avatar[0].buffer,
    userId,
  );
  const gallery = [];
  for (const file of req.files.gallery) {
    const { public_id, secure_url } = await uploadToCloudinary(
      "users",
      file.buffer,
      userId,
    );

    gallery.push({ public_id, secure_url });
  }

  await userRepo.update(userId, {
    profilePicture: { public_id, secure_url },
    coverPictures: gallery,
  });

  res.status(201).json({ message: "photos has been uploaded succcessfully" });
};

export const deleteProfileImage = async (req, res, next) => {
  const user = req.user;

  await cloudinary.uploader.destroy(user.profilePicture.public_id);
  user.profilePicture = undefined;
  await user.save();
  res
    .status(200)
    .json({ message: "profile image has been deleted successfully" });
};

export const signIn = async (req, res, next) => {
  const { email, password } = req.body;

  const existingUser = await userRepo.findOne({
    email,
    isVerified: true,
    provider: providerEnum.system,
  });

  if (!existingUser) {
    return next(new NotFoundError("user"));
  }
  const isMatched = await matchValue(password, existingUser.password);

  if (!isMatched) {
    const remainingMinutes = getRemainingTime(req.rateLimit.resetTime);
    const remainingAttempts = req.rateLimit.remaining;
    return next(
      new ValidationError(
        `${remainingAttempts > 0 ? `Invalid password. you have ${remainingAttempts} attempts` : `you exceeded your attempts. please try again after ${remainingMinutes}`}`,
      ),
    );
  }

  const jwtid = randomUUID();

  const accessToken = jwt.sign(
    { id: existingUser._id },
    process.env.ACCESS_SECRET_KEY,
    { expiresIn: "15m", jwtid },
  );

  const refreshToken = jwt.sign(
    { id: existingUser._id },
    process.env.REFRESH_SECRET_KEY,
    { expiresIn: "30d", jwtid },
  );

  res.status(200).json({
    message: "user logged in successfully",
    accessToken,
    refreshToken,
  });
};

export const getProfile = async (req, res, next) => {
  const { id: profileId } = req.params;
  const viewerId = req.user?.id; // from optionalAuth

  const profileOwner = await userRepo.findById(profileId, {
    firstName: 1,
    lastName: 1,
    totalViews: 1,
  });
  if (!profileOwner) {
    return next(new NotFoundError("user"));
  }
  //if owner of profile logged in and  view his profile, he see all its profile content
  if (viewerId == profileId) {
    const originalUser = await userRepo.findById(viewerId, { password: 0 });
    return res.status(200).json(originalUser);
  }

  //other users hasve access to view profile of original user but only allowed content not all
  if (viewerId && viewerId !== profileId) {
    try {
      await profileViewRepo.create({ profileId, viewerId });
      await userRepo.update(profileId, {
        $inc: { totalViews: 1 },
      });
    } catch (error) {
      if (error.code !== 11000) {
        return next(error);
      }
    }
  }

  res.status(200).json(profileOwner);
};

export const shareProfileLink = async (req, res, next) => {
  const { id: profileId } = req.params;
  const user = await userRepo.findById(profileId, {
    firstName: 1,
    lastName: 1,
    profilePicture: 1,
  });
  if (!user) {
    return next(new NotFoundError("user"));
  }
  res
    .status(200)
    .json({ user, profileLink: `www.saraha.com/profile/${profileId}` }); //frontend url
};

export const updateUser = async (req, res, next) => {
  const allowedUpdates = ["firstName", "lastName", "email"];
  const userId = req.user?._id;
  const user = req.user;

  const updates = {};
  for (const key of allowedUpdates) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  if (updates.email && user.email !== updates.email) {
    const emailUsed = await userRepo.findOne({
      email: updates.email,
      _id: { $ne: userId },
    });
    if (emailUsed) {
      return next(new DuplicateEntryError(emailUsed));
    }
  }
  Object.assign(user, updates);
  await user.save();
  res.status(200).json({ message: "user has been updated successfully" });
};

export const changePassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const user = req.user;

  const isMatched = await matchValue(oldPassword, user.password);
  if (!isMatched) {
    return next(new ValidationError("Invalid password"));
  }
  user.password = await hashValue(newPassword);
  user.changePasswordAt = new Date();
  await user.save();

  res.status(200).json({ message: "password has been updated successfully" });
};

export const useRefreshToken = async (req, res, next) => {
  const auth = req.headers?.authorization;
  if (!auth) {
    return next(new AuthError("no authentication header provided in request"));
  }
  const [prefix, token] = auth.split(" ");
  if (prefix !== "Bearer") {
    return next(
      new AuthError(
        "Invalid authorization header format. Bearer token required",
      ),
    );
  }
  if (!token) {
    return next(new AuthError("no token provided"));
  }
  const decoded = jwt.verify(token, process.env.REFRESH_SECRET_KEY);
  const revokeToken = await tokenModel.findOne({ tokenId: decoded.jti });
  if (revokeToken) {
    return next(
      new AuthError("token invalidated. you already logged out from system"),
    );
  }

  const accessToken = jwt.sign(
    { id: decoded.id },
    process.env.ACCESS_SECRET_KEY,
    { expiresIn: "15m", jwtid: decoded.jti },
  );

  res.status(200).json({ accessToken });
};

export const logout = async (req, res, next) => {
  const userId = req.user?.id;
  await tokenModel.create({
    tokenId: req.decoded?.jti,
    userId,
    expireAt: (req.decoded?.iat + 60 * 60 * 24 * 7) * 1000, // i need time of expiration of refresh token to be added to database
    // so i take created time of access token and add to it ttl of refresh token
  });

  res.status(200).json({ message: "logged out successfully" });
};

export const forgetPassword = async (req, res, next) => {
  const { email } = req.body;
  const existingUser = await userRepo.findOne({
    email,
    isVerified: true,
    provider: providerEnum.system,
  });

  if (!existingUser) {
    return next(new NotFoundError("user"));
  }

  const otp = generateOTP();
  const hashedOTP = await hashValue(otp);

  eventEmitter.emit(userEvents.forgetPassword, async () => {
    await redisRepository.setCache(
      `otp:${email}:forgetPassword`,
      hashedOTP,
      600,
    );
    await sendEmailVerification(email, otp);
  });

  res.status(200).json({ message: "otp send for password reset" });
};
//reset password after using confirm password route
export const resetPassword = async (req, res, next) => {
  const { email, otp, password } = req.body;
  const hashedOTP = await redisRepository.getCache(
    `otp:${email}:forgetPassword`,
  );

  if (!hashedOTP) {
    return next(new AuthError("OTP has expired", "OTP_EXPIRED"));
  }

  const isMatched = await matchValue(otp, hashedOTP);

  if (!isMatched) {
    return next(new ValidationError("Invalid OTP"));
  }

  const user = await userRepo.findAndUpdate(
    {
      email,
      isVerified: true,
      provider: providerEnum.system,
    },
    { password: await hashValue(password), changePasswordAt: new Date() },
  );
  if (!user) {
    return next(new NotFoundError("user"));
  }

  await redisRepository.deleteCache(`otp:${email}:forgetPassword`);

  res.status(200).json({ message: "password has reset successfully" });
};
