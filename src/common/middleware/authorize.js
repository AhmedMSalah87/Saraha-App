import { roleEnum } from "../enums/user.enum.js";

export const authorizeMiddleware = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new Error("unauthorized", { cause: 401 }));
    }
    next();
  };
};

authorizeMiddleware(Object.values(roleEnum));
