import Joi from "joi";
import { Types } from "mongoose";
import { GenderEnum } from "../enums/user.enum.js";

export const validationRules = {
  id: Joi.custom((value, helpers) => {
    const isValid = Types.ObjectId.isValid(value);
    return isValid ? value : helpers.message("invalid id");
  }),
  firstName: Joi.string(),
  lastName: Joi.string(),
  email: Joi.string().email(),
  password: Joi.string().min(8).max(20),
  gender: Joi.string().valid(...Object.values(GenderEnum)),
};
