import mongoose, { Document, Schema } from "mongoose";

export interface IPostCode extends Document {
  carrier_id: mongoose.Schema.Types.ObjectId;
  name: string;
  service: string;
  amount: number;
}

const postCodeSchema: Schema = new Schema({
  carrier_id: { type: Schema.Types.ObjectId, required: false, ref: "Carrier" },
  service: { type: String, required: false },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
});

export const PostCode = mongoose.model<IPostCode>("PostCode", postCodeSchema);
