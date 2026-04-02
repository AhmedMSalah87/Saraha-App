import jwt from "jsonwebtoken";
import { tokenModel } from "../../db/models/token.model.js";
import { AuthError } from "../../errors/appErrors.js";
import { getToken } from "../utils/getToken.js";

export const optionalAuth = async (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return next();
  }

  const decoded = jwt.verify(token, process.env.ACCESS_SECRET_KEY);

  const revokeToken = await tokenModel.findOne({ tokenId: decoded.jti });
  if (revokeToken) {
    return next(
      new AuthError("token revoked. you already logged out from system"),
    );
  }

  req.user = decoded;

  next();
};
