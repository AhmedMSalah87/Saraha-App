import { DatabaseRepository } from "../../db/db.repository.js";
import { userModel } from "../../db/models/user.model.js";
import { randomUUID } from "node:crypto";
import { profileViewsModel } from "../../db/models/profileViews.model.js";
import {
  hashPassword,
  matchPassword,
} from "../../common/utils/security/hash.js";
import jwt from "jsonwebtoken";
import cloudinary, {
  uploadToCloudinary,
} from "../../common/utils/cloudinary.js";
import { tokenModel } from "../../db/models/token.model.js";
import { sendEmailVerification } from "../../common/utils/sendEmail.js";
import { generateOTP } from "../../common/utils/generateOTP.js";
import { redisRepository } from "../../db/redis/redis.repository.js";
import { providerEnum } from "../../common/enums/user.enum.js";

export const userRepo = new DatabaseRepository(userModel);
const profileViewRepo = new DatabaseRepository(profileViewsModel);

export const createUser = async (req, res, next) => {
  const { firstName, lastName, email, password, gender } = req.body;

  const existingUser = await userRepo.findOne({ email });
  if (existingUser) {
    return next(new Error("email already exists", { cause: 409 }));
  }
  const hashedPassword = await hashPassword(password);
  await userRepo.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    gender,
    isVerified: false,
  });

  const otp = generateOTP();
  const hashedOTP = await hashPassword(otp.toString());

  await redisRepository.setCache(`otp:${email}`, hashedOTP, 600);

  try {
    await sendEmailVerification(email, otp);
  } catch (error) {
    await redisRepository.deleteCache(`otp:${email}`);
    next(error);
  }

  res.status(201).json({
    message: "User created successfully. Verification OTP sent to email.",
  });
};

export const verifyEmail = async (req, res, next) => {
  const { email, otp } = req.body;
  const existingUser = await userRepo.findOne({
    email,
    isVerified: false,
    provider: providerEnum.system,
  });

  if (!existingUser) {
    return next(new Error("user not found", { cause: 404 }));
  }
  const hashedOTP = await redisRepository.getCache(`otp:${email}`);

  if (!hashedOTP) {
    return next(new Error("otp has expired", { cause: 401 }));
  }

  const isMatched = await matchPassword(otp, hashedOTP);

  if (!isMatched) {
    return next(new Error("otp is invalid"));
  }

  existingUser.isVerified = true;
  await existingUser.save();

  await redisRepository.deleteCache(`otp:${email}`);

  res.status(200).json({ message: "email verified successfully" });
};

export const uploadPhoto = async (req, res, next) => {
  const userId = req.user?._id;
  if (!req.files) {
    return next(new Error("photo files are required", { cause: 400 }));
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
    return next(new Error("user not found", { cause: 404 }));
  }
  const isMatched = await matchPassword(password, existingUser.password);

  if (!isMatched) {
    return next(new Error("invalid password", { cause: 400 }));
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
    return next(new Error("user not found", { cause: 400 }));
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
      user.totalViews += 1;
      await user.save();
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
    return next(new Error("user not found", { cause: 404 }));
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
      return next(new Error("email already exists", { cause: 409 }));
    }
  }
  Object.assign(user, updates);
  await user.save();
  res.status(200).json({ message: "user has been updated successfully" });
};

export const changePassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const user = req.user;

  const isMatched = await matchPassword(oldPassword, user.password);
  if (!isMatched) {
    return next(new Error("old password in incorrect", { cause: 400 }));
  }
  user.password = await hashPassword(newPassword);
  user.changePasswordAt = new Date();
  await user.save();

  res.status(200).json({ message: "password has been updated successfully" });
};

export const useRefreshToken = async (req, res, next) => {
  const auth = req.headers?.authorization;
  if (!auth) {
    return next(
      new Error("no authentication header provided in request", {
        cause: 401,
      }),
    );
  }
  const [prefix, token] = auth.split(" ");
  if (prefix !== "Bearer") {
    return next(
      new Error("Invalid authorization header format. Bearer token required", {
        cause: 401,
      }),
    );
  }
  if (!token) {
    return next(new Error("unauthorized: no token provided", { cause: 401 }));
  }
  const decoded = jwt.verify(token, process.env.REFRESH_SECRET_KEY);
  const revokeToken = await tokenModel.findOne({ tokenId: decoded.jti });
  if (revokeToken) {
    return next(
      new Error("token invalidated. you already logged out from system", {
        cause: 401,
      }),
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
