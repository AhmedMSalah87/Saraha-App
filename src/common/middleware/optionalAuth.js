import jwt from "jsonwebtoken";

export const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next();
  }

  const decoded = jwt.verify(token, process.env.ACCESS_SECRET_KEY);
  req.user = decoded;

  next();
};
