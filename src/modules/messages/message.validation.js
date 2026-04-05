import Joi from "joi";
import { validationRules } from "../../common/utils/generalValidation.js";

export const messageSchema = {
  body: Joi.object({
    content: validationRules.message.required(),
  }).required(),
  params: Joi.object({
    id: validationRules.id.required(),
  }).required(),
};
