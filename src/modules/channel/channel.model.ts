import mongoose, { Document, Schema } from "mongoose";

export interface IChannel extends Document {
  channel_id: number;
  name: string;
  type: string;
  enable: boolean;
  client: string;
}

const channelSchema: Schema = new Schema(
  {
    channel_id: { type: Number, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    enable: { type: Boolean, required: true },
    client: { type: String, required: false },
  },
  { timestamps: true }
);

export const Channel = mongoose.model<IChannel>("Channel", channelSchema);
