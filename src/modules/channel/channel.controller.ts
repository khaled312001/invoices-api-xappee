import { Request, Response } from "express";
import {
  getChannelsById,
  getChannels,
  getChannelsByClient,
} from "./channel.service";

export const handleGetChannels = async (req: Request, res: Response) => {
  try {
    const channels = await getChannels();
    res.status(200).json({channels});
  } catch (error: any) {
    res.status(500).json({
      message: "Something went wrong while getting channels",
      error: error?.message || "No error message",
    });
  }
};

export const handleGetChannelWithId = async (req: Request, res: Response) => {
  try {
    const { channelIds } = req.body;
    const channels = await getChannelsById(channelIds);
    res.status(200).json({channels});
  } catch (error: any) {
    res.status(500).json({
      message: "Something went wrong while getting channels",
      error: error?.message || "No error message",
    });
  }
};

export const handleGetChannelWithClient = async (
  req: Request,
  res: Response
) => {
  try {
    const { client } = req.params;  

    const channels = await getChannelsByClient(String(client));
    res.status(200).json({ channels });
  } catch (err: any) {
    res.status(500).json({ message: "Somehtign went wrong", error: err });
  }
};
