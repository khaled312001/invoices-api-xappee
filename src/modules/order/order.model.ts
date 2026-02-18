import mongoose, { Schema, Document, mongo } from "mongoose";

export interface IOrder extends Document {
  orderTotalQunatity: any;
  selroOrderId: string;
  id: string;

  purchaseDate: string | number;
  lastUpdateDate: string | number;
  dispatchDate: string | number;
  shippedDate: string | number;

  channel: string;
  selroChannelName: string;

  site: string;
  totalPrice: number;
  trackingNumber: string;
  carrierName: string;
  shippingMethod: string;
  shipmentServiceLevelCategory: string;
  shipServiceLevel: string;
  shipCountry: string;
  channelSales: Array<any>;
  items: Array<any>;
  channelSalesLength: number;
  currencyName: string;
  shipPostalCode: string;
  totalWeight: number;
  orderTotalItemsQunatity: number;
  orderMaxParcels: number;
  orderMinParcels: number;
  totalOrderParcels: number;
  totalItems: number;
  currencyCode: string;
  fulfillmentChannel: string;
  isDeleted: boolean;

  prepQty: number;
  prepCharge: number;
}

const orderSchema: Schema = new Schema(
  {
    selroOrderId: { type: String, required: false, unique: true },
    id: { type: String, required: false, unique: true },
    purchaseDate: { type: Schema.Types.Mixed, requried: false },
    lastUpdateDate: { type: Schema.Types.Mixed, requried: false },
    dispatchDate: { type: Schema.Types.Mixed, requried: false },
    shippedDate: { type: Schema.Types.Mixed, requried: false },
    channel: { type: String, required: false },
    selroChannelName: { type: String, required: false },

    site: { type: String, required: false },
    totalPrice: { type: Number, required: false },
    trackingNumber: { type: String, required: false },
    carrierName: { type: String, required: false },
    shippingMethod: { type: String, required: false },
    shipmentServiceLevelCategory: { type: String, required: false },
    shipServiceLevel: { type: String, required: false },
    shipCountry: { type: String, required: false },
    channelSales: { type: Array, required: false },
    items: { type: Array, required: false },
    channelSalesLength: { type: Number, required: false },
    currencyName: { type: String, required: false },
    shipPostalCode: { type: String, required: false },
    totalWeight: { type: Number, required: false },
    totalItems: { type: Number, required: false },
    orderTotalQunatity: { type: Number, required: false },
    orderMaxParcels: { type: Number, required: false },
    orderMinParcels: { type: Number, required: false },
    totalOrderParcels: { type: Number, required: false },
    currencyCode: { type: String, required: false },
    fulfillmentChannel: { type: String, required: false },
    isDeleted: { type: Boolean, default: false },

    prepCharge: { type: Number, required: false },
    prepQty: { type: Number, required: false },
  },
  { timestamps: true }
);

export interface IImportLog extends Document {
  from: string;
  to: string;
  channelId: number;
}
const importLogSchema: Schema = new Schema(
  {
    channelId: { type: Number, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model<IOrder>("Order", orderSchema);
export const ImportReport = mongoose.model<IImportLog>(
  "ImportReport",
  importLogSchema
);
