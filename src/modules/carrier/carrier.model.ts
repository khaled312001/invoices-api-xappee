import mongoose, { Document, Schema } from "mongoose";

export interface ICharge {
  "100": number;
  "250": number;
  "500": number;
  "750": number;
  "1000": number;
  "2000": number;
  "3000": number;
  "5000": number;
  "10000": number;
  "15000": number;
  "17000": number;
  "30000": number;
}
export interface ICarrierService {
  name: string;
  charges: ICharge;
}
export interface ICarrier extends Document {
  name: string;
  services: ICarrierService[];
  discount: number;
}

const carrierSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true},
    services: { type: Array, required: true },
    discount: { type: Number, required: false },
  },
  { timestamps: true }
);

export const Carrier = mongoose.model<ICarrier>("Carrier", carrierSchema);
