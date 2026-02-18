import {
  CustomInvoice,
  FulfillmentInvoice,
  ICustomInvoice,
  IFulfillmentInvoice,
  IStorageInvoice,
  StorageInvoice as StorageInvoiceModel, // Rename to avoid conflicts
} from "./invoice.model";
import { InvoiceByOrderRecord, InvoiceByServcie } from "./invoices";


const findFulfillmentInvoiceByRange = async (dateRange: {
  from: string;
  to: string;
}) => {
  return await FulfillmentInvoice.findOne({
    from: dateRange.from,
    to: dateRange.to,
  }).lean();
};

const findStorageInvoiceByRange = async (dateRange: {
  from: string;
  to: string;
}) => {
  return await StorageInvoiceModel.findOne({
    from: dateRange.from,
    to: dateRange.to,
  });
};

// add new
export const addNewFulfillmentInvoice = async (
  dateRange: { from: string; to: string },
  channels: number[],
  InvoiceByOrder: InvoiceByOrderRecord,
  InvoiceByService: InvoiceByServcie,
  clientName: string,
  clientEmail: string,
  clientAddress: string,
  clientBusinessName: string,
  problems: Record<string, string[]>,
  totals: any,
  expenseCause?: string,
  expenseValue?: number
): Promise<IFulfillmentInvoice> => {
  const existingInvoice = (await findFulfillmentInvoiceByRange(
    dateRange
  )) as IFulfillmentInvoice;
  if (existingInvoice) await deleteFulfillmentInvoiceById(existingInvoice._id);
  expenseCause = expenseCause ?? '';
  expenseValue = expenseValue ?? 0;
  const newInvoice = new FulfillmentInvoice({
    client: clientName,
    clientEmail,
    clientAddress,
    clientBusinessName,
    from: dateRange.from,
    to: dateRange.to,
    channels,
    expenseCause,
    expenseValue ,
    orders: Object.values(InvoiceByOrder),
    services: Object.values(InvoiceByService),
    problems: Object.values(problems),
    totals,
  });
  return await newInvoice.save();
};

export const addNewStorageInvoice = async (
  from: any,
  to: any,
  client: string,
  clientEmail: string,
  clientAddress: string,
  clientBusinessName: string,
  items: Record<string, any>,
  monthlySubtotal: number,
  weeklySubTotal: number,
  totalStorageSpace: number
): Promise<IStorageInvoice> => {
  const existingInvoice = (await findStorageInvoiceByRange({
    from,
    to,
  })) as IStorageInvoice;
  if (existingInvoice) await deleteStorageInvoiceById(existingInvoice._id);

  const itemsList = Object.values(items);
  const newInvoice = new StorageInvoiceModel({
    from,
    to,
    client,
    clientEmail,
    clientAddress,
    clientBusinessName,
    items: itemsList,
    monthlySubtotal,
    weeklySubTotal,
    totalStorageSpace,
  });
  return await newInvoice.save();
};

// get all
export const getFulfillmentInvoices = async (client: string) => {
  return await FulfillmentInvoice.find({ client });
};

export const getStorageInvoices = async (client: string) => {
  return await StorageInvoiceModel.find({ client });
};

export const getStorageInvoicesCount = async (client: string) => {
  const count = await StorageInvoiceModel.countDocuments({ client });
console.log("count",count)
  return { exists: count > 0, count };
};

// get by id
export const getStorageInvoiceById = async (_id: string) => {
  return await StorageInvoiceModel.findOne({ _id }).lean();
};

export const getFulfillmentInvoiceById = async (_id: string) => {
  return await FulfillmentInvoice.findOne({ _id }).lean();
};

// delete
export const deleteStorageInvoiceById = async (_id: string) => {
  return await StorageInvoiceModel.deleteOne({ _id });
};
export const deleteFulfillmentInvoiceById = async (_id: string) => {
  return await FulfillmentInvoice.deleteOne({ _id });
};

export const updateStorageInvoiceById = async (
  _id: string,
  invoice: IStorageInvoice
) => {
  return await StorageInvoiceModel.findOneAndUpdate({ _id }, invoice);
};

export const updateFulfillmentInvoiceById = async (
  _id: string,
  invoice: IFulfillmentInvoice
) => {
  return await FulfillmentInvoice.findOneAndUpdate({ _id }, invoice);
};


export const getCustomInvoices = async (user: any) => {
  const query: any = {};

  // Apply filter if the user's role is "user"
  if (user.role === "user") {
    query.client = user.client; // Match the single `client` field
  }

  console.log("Query:", query);
  console.log("Invoices:", await CustomInvoice.find(query));

  return await CustomInvoice.find(query);
};

export const getCustomInvoiceById = async (_id: string) => {
  return await CustomInvoice.findOne({ _id }).lean();
};

export const updateCustomInvoice = async (
  _id: string,
  invoice: ICustomInvoice
) => {
  return await CustomInvoice.findOneAndUpdate({ _id }, invoice);
};

export const deleteCustomInvoiceById = async (_id: string) => {
  return await CustomInvoice.deleteOne({ _id });
};

export const calculateSubtotal = (invoice: ICustomInvoice) => {
  return invoice.items.reduce((acc, item) => acc + (item.price * item.qty), 0);
};

export const calculateDiscount = (invoice: ICustomInvoice) => {
  const subtotal = calculateSubtotal(invoice);
  if (invoice.discountType === 'percentage') {
    return (subtotal * (invoice.discount / 100)).toFixed(2);
  } else {
    return invoice.discount.toFixed(2);
  }
};

export const calculateTax = (invoice: ICustomInvoice, total: number) => {
  return (total * (invoice.taxRate / 100)).toFixed(2);
};

export const calculateTotal = (invoice: ICustomInvoice) => {
  const subtotal = calculateSubtotal(invoice);
  const discount = parseFloat(calculateDiscount(invoice));
  const totalAfterDiscount = subtotal - discount;
  const tax = parseFloat(calculateTax(invoice, totalAfterDiscount));
  return (totalAfterDiscount + tax);
};

