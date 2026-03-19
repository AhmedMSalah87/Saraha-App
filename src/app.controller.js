import express from "express";
import { checkDBconnection } from "./db/config/connection.js";
import { userRouter } from "./modules/users/user.controller.js";
import { messageRouter } from "./modules/messages/message.controller.js";
import { connectRedis } from "./db/redis/redis.connect.js";

const app = express();

export const bootstrap = () => {
  app.use(express.json());
  checkDBconnection();
  connectRedis();

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
    res.status(err.cause || 500).json({ type: err.name, message: err.message });
  });

  app.listen(process.env.PORT, () => {
    console.log("app is running");
  });
};
