import { AuthError } from "../../errors/appErrors.js";
import { roleEnum } from "../enums/user.enum.js";

export const authorizeMiddleware = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AuthError());
    }
    next();
  };
};

authorizeMiddleware(Object.values(roleEnum));
