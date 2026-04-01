import { DatabaseRepository } from "../../db/db.repository.js";
import { messageModel } from "../../db/models/message.model.js";
import { NotFoundError } from "../../errors/appErrors.js";
import { userRepo } from "../users/user.service.js";

const messageRepo = new DatabaseRepository(messageModel);

export const sendMessage = async (req, res, next) => {
  const { id } = req.params;
  const { content } = req.body;

  const user = await userRepo.findById(id);
  if (!user) {
    return next(new NotFoundError("user"));
  }
  await messageRepo.create({ content, receiver: id });
  res.status(201).json({ message: "message sent successfully" });
};

export const getMessages = async (req, res, next) => {
  const id = req.user?.id;

  const messages = await messageRepo
    .findAll({ receiver: id })
    .populate({ path: "receiver", select: "firstName lastName email" });

  res.status(200).json(messages);
};
