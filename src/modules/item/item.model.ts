import mongoose, { Document, Schema } from "mongoose";

export interface IItem extends Document {
  name: string;
  sku: string;
  price: number;
  items: number;
  parcels: number;
  maxParcels: number;
  length: number;
  width: number;
  height: number;
  weight: number;
  boxLength: number;
  boxWidth: number;
  boxHeight: number;
  class: string;
  qty: number;
  client: string[];
  lastUpdateDate?: number;
  skipFees?: boolean;
  orderQuantity?: number;
}

const itemSchema: Schema = new Schema({
  name: { type: String, required: false },
  sku: { type: String, required: true, unique: true },
  client: { type: [String], required: true },
  price: { type: Number, required: false },
  items: { type: Number, required: false },
  parcels: { type: Number, required: false },
  maxParcels: { type: Number, required: false },
  length: { type: Number, required: false },
  width: { type: Number, required: false },
  height: { type: Number, required: false },
  boxLength: { type: Number, required: false },
  boxWidth: { type: Number, required: false },
  boxHeight: { type: Number, required: false },
  weight: { type: Number, required: false },
  class: { type: String, required: false },
  qty: { type: Number, requried: false },
  lastUpdateDate: { type: Number, required: false },
  skipFees: { type: Boolean, required: false, default: false },
  orderQuantity: { type: Number, required: false },
});

export const Item = mongoose.model<IItem>("Item", itemSchema);
