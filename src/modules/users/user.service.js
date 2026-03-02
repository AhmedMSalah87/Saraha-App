import { DatabaseRepository } from "../../db/db.repository.js";
import { userModel } from "../../db/models/user.model.js";
import { profileViewsModel } from "../../db/models/profileViews.model.js";
import {
  hashPassword,
  matchPassword,
} from "../../common/utils/security/hash.js";
import jwt from "jsonwebtoken";

const userRepo = new DatabaseRepository(userModel);
const profileViewRepo = new DatabaseRepository(profileViewsModel);

export const createUser = async (req, res, next) => {
  const { firstName, lastName, email, password, gender } = req.body;
  console.log(req.files);
  if (!req.files) {
    return next(new Error("photo files are required", { cause: 400 }));
  }

  const photos = [];
  for (const file of req.files.attachments) {
    photos.push(file.path);
  }

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
    profilePicture: req.files.attachment[0].path,
    coverPictures: photos,
  });
  res.status(201).json({ message: "user has been created successfully" });
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
    process.env.SECRET_KEY,
    { expiresIn: "15m" },
  );

  res.status(200).json({ message: "user logged in successfully", accessToken });
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
  user.save();
  res.status(200).json({ message: "user has been updated successfully", user });
};
