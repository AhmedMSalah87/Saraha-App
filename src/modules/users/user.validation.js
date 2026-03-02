import joi from "joi";
import { GenderEnum } from "../../common/enums/user.enum.js";

export const signUpSchema = {
  body: joi.object({
    firstName: joi.string().required(),
    lastName: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().required(),
    gender: joi.string().valid(...Object.values(GenderEnum)),
  }),
};

export const signInSchema = {
  body: joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(8).max(20).required(),
  }),
};
