import joi from "joi";
import { validationRules } from "../../common/utils/generalValidation.js";

export const signUpSchema = {
  body: joi
    .object({
      firstName: validationRules.firstName.required(),
      lastName: validationRules.lastName.required(),
      email: validationRules.email.required(),
      password: validationRules.password.required(),
      gender: validationRules.gender.required(),
    })
    .required(),
};

export const signInSchema = {
  body: joi
    .object({
      email: validationRules.email.required(),
      password: validationRules.password.required(),
    })
    .required(),
};

export const profileSchema = {
  params: joi.object({
    id: validationRules.id.required(),
  }),
};
