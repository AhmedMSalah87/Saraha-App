import bcrypt from "bcrypt";

export const hashValue = async (password, saltRounds = 10) => {
  return bcrypt.hash(password, saltRounds);
};

export const matchValue = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};
