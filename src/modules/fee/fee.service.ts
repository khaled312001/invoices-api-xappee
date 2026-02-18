import { Fee, IFee } from "./fee.model";

export const getFees = async () => {
  return await Fee.findOne() as IFee;
};


export const getStorageFees = async () => {
  return await Fee.findOne().sort({ createdAt: -1 }).exec() as IFee;
};