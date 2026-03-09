import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
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

  req.user = decoded;
  next();
};
