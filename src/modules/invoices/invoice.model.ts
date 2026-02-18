import mongoose, { Schema } from "mongoose";
import { Document } from "mongoose";

export interface IFulfillmentInvoice extends Document {
  _id: string;
  client: string;
  from: string;
  to: string;
  channels?: number[];
  expenseCause?: string;
  expenseValue?: number;
  orders: {
    id: string;
    date: number;
    totalWeight: number;
    carrier: string;
    service: string;
    postcode: string;
    trackingNumber: string;
    shippingWeightGroup: any;
    handlingWeightGroup: any;
    charges: {
      postage: number;
      surge: number;
      handling: number;
      packaging: number;
      prepCharge: number;
    };
  }[];
  services: {
    carrier: string;
    service: string;
    charges: {
      postage: number;
      surge: number;
      handling: number;
      packaging: number;
      prepCharge: number;
    };
    total: number;
    problems: any[];
    printed?: boolean;
    printedDate?: string;
  }[];
  totals: {
    totalPostage: number;
    totalSurge: number;
    totalHandling: number;
    totalPackaging: number;
    total: number;
  };
  lastMessageId: string;
  emailedDate: any;
  clientEmail: string;
  clientAddress: string;
  clientBusinessName: string;
  createdAt: string;
}

const FulfillmentInvoiceSchema: Schema = new Schema(
  {
    client: { type: String, required: false },
    expenseCause: { type: String, required: false },
    expenseValue: { type: Number, required: false },
    from: { type: Schema.Types.String, required: true },
    to: { type: Schema.Types.String, required: true },
    channels: { type: Array, required: false },
    orders: { type: Array },
    services: { type: Array },
    problems: { type: Array },
    pritned: { type: Boolean, required: false },
    printedDate: { type: String, required: false },
    totals: { type: Object, required: false },
    lastMessageId: { type: String, required: false },
    emailedDate: { type: Object, required: false },
    clientEmail: { type: String, required: false },
    clientAddress: { type: String, required: false },
    clientBusinessName: { type: String, required: false },
  },
  { timestamps: true }
);

export const FulfillmentInvoice = mongoose.model<IFulfillmentInvoice>(
  "FulfillmentInvoice",
  FulfillmentInvoiceSchema
);

export interface IStorageInvoice extends Document {
  _id: string;
  from: string;
  to: string;
  client: string;
  items: any[];
  monthlySubtotal: number;
  weeklySubTotal: number;
  totalStorageSpace: number;
  printed?: boolean;
  printedDate?: string;
  lastMessageId?: string;
  emailedDate?: any;
  clientEmail: string;
  clientAddress: string;
  clientBusinessName: string;
  createdAt: string;
}
const StorageInvoiceSchema: Schema = new Schema(
  {
    from: { type: String, required: false },
    to: { type: String, required: false },
    client: { type: String, required: false },
    items: { type: Array, required: false },
    monthlySubtotal: { type: Number, required: false },
    weeklySubTotal: { type: Number, required: false },
    totalStorageSpace: { type: Number, required: false },
    pritned: { type: Boolean, required: false },
    printedDate: { type: String, required: false },
    lastMessageId: { type: String, required: false },
    emailedDate: { type: Object, required: false },
    clientEmail: { type: String, required: false },
    clientAddress: { type: String, required: false },
    clientBusinessName: { type: String, required: false },
  },
  { timestamps: true }
);

export const StorageInvoice = mongoose.model<IStorageInvoice>(
  "StorageInvoice",
  StorageInvoiceSchema
);


export interface ICustomInvoice extends Document {
  _id: string;
  sender: string;
  client: string;
  date: string;
  items: {
    id: string;
    description: string;
    qty: number;
    price: number;
  }[];
  discount: number;
  discountType: string;
  taxRate: number;
  showPayments: boolean;
}

const CustomInvoiceSchema: Schema = new Schema(
  {
    sender: { type: String, required: true },
    client: { type: String, required: true },
    date: { type: Schema.Types.String, required: true },
    items: { type: Array, required: true },
    discount: { type: Number, required: false },
    discountType: { type: String, required: false },
    taxRate: { type: Number, required: false },
    showPayments: { type: Boolean, required: false },
  },
  { timestamps: true }
);

export const CustomInvoice = mongoose.model<ICustomInvoice>(
  "CustomInvoice",
  CustomInvoiceSchema
);