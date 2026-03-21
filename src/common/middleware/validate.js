import { ValidationError } from "../../errors/appErrors.js";

export const validate = (schema) => {
  return (req, res, next) => {
    const validationErrors = [];
    for (const key in schema) {
      const { error, value } = schema[key].validate(req[key], {
        abortEarly: false,
      });
      if (error) {
        validationErrors.push(...error.details.map((err) => err.message)); //extract message of every error and insert it in validationErrors
      }
      if (validationErrors.length > 0) {
        return next(new ValidationError(validationErrors.join(", ")));
      }
      req[key] = value;
    }

    next();
  };
};
