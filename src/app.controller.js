import express from "express";
import { checkDBconnection } from "./db/config/connection.js";
import { userRouter } from "./modules/users/user.controller.js";
import { messageRouter } from "./modules/messages/message.controller.js";
import { connectRedis } from "./db/redis/redis.connect.js";
import { AppError } from "./errors/appErrors.js";
import { appLimiter } from "./common/middleware/rateLimiter.js";
const app = express();

export const bootstrap = () => {
  app.use(express.json());
  checkDBconnection();
  connectRedis();

  app.set("trust proxy", 1);
  app.get("/", (req, res) => {
    res.status(200).json({ message: "welcome to app" });
  });
  app.use("/uploads", express.static("uploads"));
  app.use("/users", userRouter);
  app.use("/messages", messageRouter);
  app.use((req, res) => {
    res.status(404).json({ message: "page not found" });
  });

  app.use((err, req, res, next) => {
    if (err instanceof AppError) {
      return res
        .status(err.status)
        .json({ name: err.code, message: err.message, statusCode: err.status });
    }
    res.status(500).json({ name: err.name, message: err.message, err });
  });

  app.listen(process.env.PORT, () => {
    console.log("app is running");
  });
};
