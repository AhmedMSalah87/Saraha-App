import mongoose from "mongoose";

export const generateObjectId = (req, res, next) => {
  req.userId = new mongoose.Types.ObjectId();
  next();
};
