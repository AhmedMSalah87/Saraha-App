import jwt from "jsonwebtoken";
import { tokenModel } from "../../db/models/token.model.js";
import { AuthError } from "../../errors/appErrors.js";

export const optionalAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

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
