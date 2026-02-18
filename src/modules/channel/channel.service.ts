import { Channel } from "./channel.model";

export const getChannels = async () => {
  return await Channel.find();
};

export const getChannelsById = async (ids: number[]) => {
  return await Channel.find({ channel_id: { $in: ids } });
};

export const getChannelsByClient = async (client: string) => {
  return await Channel.find({ client });
};
