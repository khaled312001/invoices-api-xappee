import mongoose, { Document, Schema } from "mongoose";

export interface IClient extends Document {
  name: string;
  busineesName: string;
  channel_ids?: number[];
  channelRefs?: any[];
  email: string;
  address: string;
  storageStartMonth?: number[];
  taxNo?: string;
  accName?: string;
  accNumber?: string;
  sortCode?: string;
  phone?: string;
  website?: string;
  imageUrl?: string;
  notes?: string;
}

const clientSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    busineesName: { type: String, unique: true },
    channel_ids: { type: Array, required: true },
    channelRefs: { type: Array, required: true },
    email: { type: String, required: true },
    address: { type: String },
    taxNo: { type: String },
    accName: { type: String },
    accNumber: { type: String },
    sortCode: { type: String },
    phone: { type: String },
    website: { type: String },
    imageUrl: { type: String },
    notes: { type: String },
    storageStartMonth: { type: Number},
  },
  { timestamps: true }
);

export const Client = mongoose.model<IClient>("Client", clientSchema);
