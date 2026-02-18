import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  image: string;
  salt: string;
  hash: string;
  status: string;
  role: string;
  strategy: string;
  tenant_ids: string[];
  client: string;
  tenant_names: string[];
  reactivated: boolean;
}

export const userSchema = new Schema(
  {
    name: { type: String },
    client: { type: String },
    // add unique username before production
    email: {
      type: String,
      lowercase: true,
      required: true,
      match: [/\S+@\S+\.\S+/, "is invalid"],
      index: true,
      unique: true,
    },
    image: {
      type: String,
      default: "https://tmpfiles.nohat.cc/visualhunter-a43893ada7.png",
    },
    salt: { type: String, required: false },
    hash: { type: String, required: false },
    status: {
      type: String,
      default: "active",
      enum: ["active", "suspended", "deleted"],
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "super", "manager", "admin"],
    },
    strategy: {
      type: String,
      default: "google",
      enum: ["local", "google"],
    },
    tenant_ids: [
      { type: Schema.Types.ObjectId, ref: "Project", requried: false },
    ],
    tenant_names: [{ type: String, required: false }],
    reactivated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);
