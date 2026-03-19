import jwt from "jsonwebtoken";
import { userRepo } from "../../modules/users/user.service.js";
import { tokenModel } from "../../db/models/token.model.js";
export const authMiddleware = async (req, res, next) => {
  const auth = req.headers?.authorization;
  if (!auth) {
    return next(
      new Error("no authentication header provided in request", {
        cause: 401,
      }),
    );
  }
  const [prefix, token] = auth.split(" ");
  if (prefix !== "Bearer") {
    return next(
      new Error("Invalid authorization header format. Bearer token required", {
        cause: 401,
      }),
    );
  }
  if (!token) {
    return next(new Error("unauthorized: no token provided", { cause: 401 }));
  }
  const decoded = jwt.verify(token, process.env.ACCESS_SECRET_KEY);
  const user = await userRepo.findById(decoded.id);
  if (!user) {
    return next(new Error("user not found", { cause: 404 }));
  }

  if (decoded.iat * 1000 < user.changePasswordAt?.getTime()) {
    return next(
      new Error("password changed and you logged out from all devices", {
        cause: 401,
      }),
    );
  }

  const revokeToken = await tokenModel.findOne({ tokenId: decoded.jti });
  if (revokeToken) {
    return next(
      new Error("token revoked. you logged out from system", { cause: 401 }),
    );
  }

  req.user = user;
  req.decoded = decoded;
  next();
};
