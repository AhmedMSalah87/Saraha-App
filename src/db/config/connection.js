import mongoose from "mongoose";

export const checkDBconnection = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017", {
      dbName: "sarahaApp",
      serverSelectionTimeoutMS: 5000,
    });
    console.log("database connected successfully");
  } catch (err) {
    console.log(err);
  }
};
