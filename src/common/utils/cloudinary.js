import dotenv from "dotenv";
dotenv.config();
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "node:stream";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

export const uploadToCloudinary = (folder, fileBuffer, id) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: `saraha app/${folder}/${id}` },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      },
    );
    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

export default cloudinary;
