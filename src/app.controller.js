import express from "express";
import { checkDBconnection } from "./db/config/connection.js";
import { userRouter } from "./modules/users/user.controller.js";
import dotenv from "dotenv";
import { messageRouter } from "./modules/messages/message.controller.js";

const app = express();

export const bootstrap = () => {
  dotenv.config();
  app.use(express.json());
  checkDBconnection();

  app.get("/", (req, res) => {
    res.status(200).json({ message: "welcome to app" });
  });
  app.use("/users", userRouter);
  app.use("/messages", messageRouter);
  app.use((req, res) => {
    res.status(404).json({ message: "page not found" });
  });

  app.use((err, req, res, next) => {
    res
      .status(err.cause || 500)
      .json({ message: err.message, stack: err.stack });
  });

  app.listen(process.env.PORT, () => {
    console.log("app is running");
  });
};
