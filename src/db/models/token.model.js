import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
  tokenId: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "user",
  },
  expireAt: {
    type: Date,
    required: true,
  },
});

tokenSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export const tokenModel =
  mongoose.models.token || mongoose.model("token", tokenSchema);
