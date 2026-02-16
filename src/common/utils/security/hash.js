import bcrypt from "bcrypt";

export const hashPassword = async (password, saltRounds = 10) => {
  return bcrypt.hash(password, saltRounds);
};

export const matchPassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};
