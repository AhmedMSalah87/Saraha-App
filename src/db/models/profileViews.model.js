import mongoose from "mongoose";

const profileViewSchema = new mongoose.Schema(
  {
    profileId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "user",
    },
    viewerId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "user",
    },
  },
  {
    timestamps: true,
  },
);

profileViewSchema.index({ profileId: 1, viewerId: 1 }, { unique: true });

export const profileViewsModel =
  mongoose.models.profileView ||
  mongoose.model("profileView", profileViewSchema);
