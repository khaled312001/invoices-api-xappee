export type InvoiceByServcie = Record<
  string,
  {
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
  }
>;

export type StorageInvoice = Record<
  string,
  {
    sku: string;
    name: string;
    qty: number;
    width: number;
    length: number;
    height: number;
    weight: number;
    CBMPerItem: number;
    totalCBM: number;
    cost: number;
  }
>;
export type InvoiceByOrderRecord = Record<
  string,
  {
    id: string;
    date: number|string;
    totalWeight: number;
    carrier: string;
    channel: string;
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
    prepCharge: number;
    prepQty: number;
  }
>;

export type THandlingWeightGroup = "15000" | "23000" | "30000";

export type TShippingWeightGroup =
  | "100"
  | "250"
  | "500"
  | "750"
  | "1000"
  | "2000"
  | "3000"
  | "5000"
  | "10000"
  | "15000"
  | "17000"
  | "30000";
