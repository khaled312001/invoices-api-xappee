import { Channel } from "../channel";
import { Client, IClient } from "./client.model";

export const getClients = async () => {
  return await Client.find().populate({
    path: "channelRefs",
    model: Channel,
    select: "type _id channel_id",
  });
};

export const getClientWithChannelIds = async (ids: number[]) => {
  return await Client.findOne({ channel_ids: { $in: ids } });
};

export const getClientWithName = async (name: string) => {
  return await Client.findOne({ name });
};


export const getClientWithEmail = async (email: string) => {
  return await Client.findOne({ email });
};

export const addClient = async (client: any) => {
  return await new Client(client).save();
};

export const deleteClient = async (name: string) => {
  return await Client.deleteOne({ name });
};

export const updateClient = async (client: IClient) => {
  return await Client.updateOne(
    { name: client.name },
    { $set: client },
    { upsert: true }
  );
};


export const updateClientStorageStart = async (client: any) => {
  return await Client.updateOne(
    { email: client.email },
    { $set: { storageStartMonth: client.storageStartMonth } },
    { upsert: true }
  );
};