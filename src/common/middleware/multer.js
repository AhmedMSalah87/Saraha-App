import multer from "multer";
import fs from "node:fs";

export const uploadLocal = (path, fileTypes) => {
  const filePath = `uploads/${path}`;
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath);
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, filePath);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (!fileTypes.includes(file.mimetype)) {
      cb(new Error("file not supported"));
    } else {
      cb(null, true);
    }
  };
  return multer({ storage, fileFilter });
};

export const uploadCloud = (fileTypes) => {
  const storage = multer.memoryStorage();
  const fileFilter = (req, file, cb) => {
    if (!fileTypes.includes(file.mimetype)) {
      cb(new Error("file not supported"));
    } else {
      cb(null, true);
    }
  };
  return multer({ storage, fileFilter });
};
