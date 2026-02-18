import express from "express";
import {
  handleGetChannelWithId,
  handleGetChannels,
  handleGetChannelWithClient
} from "./channel.controller";

export * from "./channel.controller";
export * from "./channel.model";
export * from "./channel.service";

export const channelRouter = express.Router();
channelRouter.use(express.json());
channelRouter.get("/", handleGetChannels);
channelRouter.post("/with-id", handleGetChannelWithId);
channelRouter.get("/:client", handleGetChannelWithClient);
