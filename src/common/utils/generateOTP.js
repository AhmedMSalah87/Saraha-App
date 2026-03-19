import crypto from "node:crypto";

export const generateOTP = () => {
  const otp = crypto.randomInt(100000, 1000000);
  return otp;
};
