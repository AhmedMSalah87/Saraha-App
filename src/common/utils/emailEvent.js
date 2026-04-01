import { EventEmitter } from "node:events";
import { userEvents } from "../enums/user.enum.js";

export const eventEmitter = new EventEmitter();

eventEmitter.on(userEvents.confirmEmail, async (fn) => {
  await fn();
});

eventEmitter.on(userEvents.forgetPassword, async (fn) => {
  await fn();
});
