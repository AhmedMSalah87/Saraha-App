import jwt from "jsonwebtoken";
import { userRepo } from "../../modules/users/user.service.js";
import { tokenModel } from "../../db/models/token.model.js";
import { AuthError, NotFoundError } from "../../errors/appErrors.js";
import { getToken } from "../utils/getToken.js";
export const authMiddleware = async (req, res, next) => {
  const token = getToken(req);
  if (!token) {
    return next(new AuthError("no token provided"));
  }
  const decoded = jwt.verify(token, process.env.ACCESS_SECRET_KEY);
  const user = await userRepo.findById(decoded.id);
  if (!user) {
    return next(new NotFoundError("user"));
  }

  if (decoded.iat * 1000 < user.changePasswordAt?.getTime()) {
    return next(
      new AuthError("password changed and you logged out from all devices"),
    );
  }

  const revokeToken = await tokenModel.findOne({ tokenId: decoded.jti });
  if (revokeToken) {
    return next(new AuthError("token revoked. you logged out from system"));
  }

  req.user = user;
  req.decoded = decoded;
  next();
};
