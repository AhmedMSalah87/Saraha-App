import { AuthError } from "../../errors/appErrors.js";

export const getToken = (req) => {
  const auth = req.headers?.authorization;
  if (!auth) {
    throw new AuthError("no authentication header provided in request");
  }
  const [prefix, token] = auth.split(" ");
  if (prefix !== "Bearer") {
    throw new AuthError(
      "Invalid authorization header format. Bearer token required",
    );
  }
  return token;
};
