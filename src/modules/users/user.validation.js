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
  params: joi
    .object({
      id: validationRules.id.required(),
    })
    .required(),
};

export const changePasswordSchema = {
  body: joi
    .object({
      oldPassword: validationRules.password.required(),
      newPassword: validationRules.password.required(),
    })
    .required(),
};

export const updateUserSchema = {
  body: joi
    .object({
      firstName: validationRules.firstName,
      lastName: validationRules.lastName,
      email: validationRules.email,
    })
    .required(),
};

const emailOtpSchema = joi.object({
  email: validationRules.email.required(),
  otp: validationRules.otp.required(),
});

export const verifyEmailSchema = {
  body: emailOtpSchema.required(),
};

export const resetPasswordSchema = {
  body: emailOtpSchema
    .append({
      password: validationRules.password.required(),
    })
    .required(),
};

export const emailSchema = {
  body: joi
    .object({
      email: validationRules.email.required(),
    })
    .required(),
};
