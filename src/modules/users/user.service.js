import { DatabaseRepository } from "../../db/db.repository.js";
import { userModel } from "../../db/models/user.model.js";
import { profileViewsModel } from "../../db/models/profileViews.model.js";
import {
  hashPassword,
  matchPassword,
} from "../../common/utils/security/hash.js";
import jwt from "jsonwebtoken";
import cloudinary, {
  uploadToCloudinary,
} from "../../common/utils/cloudinary.js";

const userRepo = new DatabaseRepository(userModel);
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
  });
  res.status(201).json({ message: "user has been created successfully" });
};

export const uploadPhoto = async (req, res, next) => {
  const userId = req.user?.id;
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
  const userId = req.user?.id;
  if (!userId) {
    return next(new Error("unauthorized user", { cause: 401 }));
  }
  const user = await userRepo.findById(userId);
  if (!user) {
    return next(new Error("user not found", { cause: 404 }));
  }
  await cloudinary.uploader.destroy(user.profilePicture.public_id);
  user.profilePicture = undefined;
  await user.save();
  res
    .status(200)
    .json({ message: "profile image has been deleted successfully" });
};

export const signIn = async (req, res, next) => {
  const { email, password } = req.body;

  const existingUser = await userRepo.findOne({ email });

  if (!existingUser) {
    return next(new Error("user not found", { cause: 404 }));
  }
  const isMatched = await matchPassword(password, existingUser.password);

  if (!isMatched) {
    return next(new Error("invalid password", { cause: 400 }));
  }
  const accessToken = jwt.sign(
    { id: existingUser._id },
    process.env.ACCESS_SECRET_KEY,
    { expiresIn: "15m" },
  );

  const refreshToken = jwt.sign(
    { id: existingUser._id },
    process.env.REFRESH_SECRET_KEY,
    { expiresIn: "30d" },
  );

  res.status(200).json({
    message: "user logged in successfully",
    accessToken,
    refreshToken,
  });
};

export const getProfile = async (req, res, next) => {
  const { id: profileId } = req.params;
  const viewerId = req.user?.id;
  const user = await userRepo.findById(profileId, { password: 0 });
  if (!user) {
    return next(new Error("user not found", { cause: 400 }));
  }
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

  res.status(200).json(user);
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
  const id = req.user?.id;
  const updates = {};
  for (const key of allowedUpdates) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  const user = await userRepo.findById(id);
  if (!user) {
    return next(new Error("user not found", { cause: 404 }));
  }

  if (updates.email && user.email !== updates.email) {
    const emailUsed = await userRepo.findOne({
      email: updates.email,
      _id: { $ne: id },
    });
    if (emailUsed) {
      return next(new Error("email already exists", { cause: 409 }));
    }
  }
  Object.assign(user, updates);
  await user.save();
  res.status(200).json({ message: "user has been updated successfully", user });
};

export const resetPassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user?.id;
  const user = await userRepo.findById(userId);
  if (!user) {
    return next(new Error("user not found", { cause: 404 }));
  }
  const isMatched = await matchPassword(oldPassword, user.password);
  if (!isMatched) {
    return next(new Error("old password in incorrect", { cause: 400 }));
  }
  user.password = await hashPassword(newPassword);
  await user.save();

  res.status(200).json({ message: "password has been reset successfully" });
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

  const accessToken = jwt.sign(
    { id: decoded.id },
    process.env.ACCESS_SECRET_KEY,
    { expiresIn: "15m" },
  );

  res.status(200).json({ accessToken });
};
