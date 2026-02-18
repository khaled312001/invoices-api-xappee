import { packagingFees } from "../../constants/packaging";
import { parcelForcePostCodes } from "../../constants/parcelForceZones";
import {
  handling_weight_groups,
  shipping_weight_groups,
} from "../../constants/weightGroup";
import { getCarriers } from "../carrier";
import { getFees, getStorageFees } from "../fee/fee.service";
import { IItem } from "../item";
import { IOrder } from "../order";
import { getPostCodesByName } from "../postcode/postcode.service";
import {
  InvoiceByOrderRecord,
  InvoiceByServcie,
  THandlingWeightGroup,
  TShippingWeightGroup,
} from "./invoices";
import fs from 'fs';

export const findZoneByPostcode = (postcode: string) => {
  // Loop through the parcelForcePostCodes array
  for (let i = 0; i < parcelForcePostCodes.length; i++) {
    const location = parcelForcePostCodes[i];
    // Check if the postcode is in the current location's Postcodes array
    if (location.Postcodes.includes(postcode)) {
      // Return the Zone number if found
      return location.Zone;
    }
  }
  // Return null if postcode is not found in any location
  return null;
};

export const matchAndGetPostCode = (
  postCodes: any[],
  ofaPostCode: string,
  carrierName: string,
  serviceName: string
) => {
  const result = postCodes.find(
    (item) =>
      item.carrier === carrierName &&
      item.service === serviceName &&
      item.name === ofaPostCode.toUpperCase()
  );

  // If not found, search for the item with the given carrier and name only
  if (!result) {
    return postCodes.find(
      (item) =>
        item.carrier === carrierName &&
        item.name === ofaPostCode.toUpperCase()
    )?.amount;
  }

  return result.amount;
};

export const getOrdersPostCodes = async (orders: IOrder[]) => {
  return orders.map((order) => order.shipPostalCode);
};

export const findWeightGroup = (weight: number, groupReference: any[]) => {
  return (groupReference.find((g) => weight <= g) ||
    groupReference[groupReference.length - 1]) as any;
};

export const getPostCode = (postCode: string) => {
  //remove all spaces
  const noSpaces = postCode.replace(/\s+/g, "");
  //remove last 3 chars
  const truncatePostCode = noSpaces.substring(0, noSpaces.length - 3);
  //convert to upper case
  const upperCasePostCode = truncatePostCode.toUpperCase();
  return upperCasePostCode;
};

// export const generateInvoices = async (orders: IOrder[]) => {
//   const InvoiceByOrder: InvoiceByOrderRecord = {};
//   const InvoiceByService: InvoiceByServcie = {};

//   const carriers = await getCarriers(); // each carrier have different services/fees
//   const fees = (await getFees()) as any; // all the fees for handling & packagin from database
//   const ordersPostCodes = await getOrdersPostCodes(orders);
//   const postCodes = await getPostCodesByName(ordersPostCodes);

//   for (const order of orders) {
//     let postage = 0;
//     let handling = 0;
//     let packaging = 0;
//     let surge = 0;

//     const totalWeight = order.totalWeight;
//     const totalWeightGroup_handling: THandlingWeightGroup = findWeightGroup(
//       totalWeight,
//       handling_weight_groups // see ./constants.ts
//     );
//     const totalWeightGroup_shipping: TShippingWeightGroup = findWeightGroup(
//       totalWeight,
//       shipping_weight_groups
//     );

//     const orderShippingMethod =
//       order.shippingMethod.split("|")[1] ?? order.shippingMethod;

//     // get carrier
//     const carrier = carriers.find(
//       (c) => c.name.toLowerCase() === order.carrierName.toLowerCase()
//     );
//     if (!carrier) continue; // TO-DO log issues

//     // get service
//     const service: any = carrier?.services.find(
//       (s) => s.name.toLowerCase() === orderShippingMethod.toLowerCase()
//     );
//     if (!service) continue;

//     postage += service.charges[totalWeightGroup_shipping] || 0;

//     switch (carrier.name) {
//       case "Evri" || "Yodel": {
//         const ofaPostCode = order.shipPostalCode;
//         postage += Number(matchAndGetPostCode(postCodes, ofaPostCode));
//       }
//     }

//     // calculate handling fees
//     handling += fees?.handling[totalWeightGroup_handling] || 0;

//     for (const item of order.channelSales) {
//       const itemWeightGroup_handling = findWeightGroup(
//         item.weight,
//         handling_weight_groups
//       );

//       const { quantityPurchased, parcels } = item;
//       const parcelsForHandling = Math.ceil(quantityPurchased - (parcels || 1));

//       // addional handling fees if there is more than one item
//       handling +=
//         (fees?.addionalHandling[itemWeightGroup_handling] || 0) *
//         Math.max(1, parcelsForHandling);
//       // packaging fees
//       // TO-DO:  **swich for using fees.classes instead of constant packagin fees**
//       if (item.class) {
//         packaging += packagingFees[item.class][itemWeightGroup_handling] || 0;
//       }
//     }

//     surge += (fees.surge[carrier.name] / 100) * postage;

//     InvoiceByOrder[order.id] = {
//       id: order.id,
//       carrier: carrier.name,
//       date: order.dispatchDate,
//       postcode: order.shipPostalCode,
//       service: service.name,
//       totalWeight,
//       shippingWeightGroup: totalWeightGroup_shipping,
//       handlingWeightGroup: totalWeightGroup_handling,
//       charges: {
//         handling,
//         packaging,
//         surge,
//         postage: postage,
//       },
//       trackingNumber: order.trackingNumber,
//     };

//     if (!InvoiceByService[service.name]) {
//       InvoiceByService[service.name] = {
//         carrier: carrier.name,
//         service: service.name,
//         charges: { handling: 0, packaging: 0, surge: 0, postage: 0 },
//         total: 0,
//       };
//     }
//     const serviceInvoice = InvoiceByService[service.name];
//     serviceInvoice.charges.handling += handling;
//     serviceInvoice.charges.packaging += packaging;
//     serviceInvoice.charges.postage += postage;
//     serviceInvoice.charges.surge += surge;
//     serviceInvoice.total += handling + packaging + postage;
//   }

//   return { InvoiceByOrder, InvoiceByService };
// };

export const getItemStock = async (sku: string) => {
  const url = `${process.env.SELRO_API_ENDPOINT}/stock?secret=${process.env.SELRO_API_SECRET}&key=${process.env.SELRO_API_KEY}&sku=${sku}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch orders for sku ${sku}`);
  }

  const data = (await res.json()) as any;
  return data.product as any;
};
// const calculateStorageFee = async (item: IItem,total_item_cbm: number) => {
//   const { width, length, height, qty, client, boxWidth, boxLength, boxHeight } = item;
//   //console.log("new qty",item.sku,qty)
//   const { storage } = (await getStorageFees()) as any;
//   let w, l, h;

//   if (client.includes("mossodor") || client.includes("Prime Footwear") && boxWidth && boxLength && boxHeight) {
//     w = boxWidth;
//     l = boxLength;
//     h = boxHeight;
//   } else {
//     w = width;
//     l = length;
//     h = height;
//   }

//   if (!w || !l || !h || !qty)
//     return {
//       ...item,
//       item_CBM: 0,
//       total_CBM: 0,
//       ECM: 0,
//       weeklyFee: 0,
//       montlyFee: 0,
//       problem: true,
//     };
//   const item_CBM = (w * l * h) / 1000000; //size cbm
//   let total_CBM = item_CBM * qty;
//    if (total_item_cbm <=2 && total_CBM < 2) total_CBM = 2;
//   // const ECM = total_CBM * 1.35; // effective cubic meter ( space utilized by the item and the space around it)
//   // const weeklyFee = ECM * 2.35;
//   const ECM = total_CBM * storage.space; // effective cubic meter ( space utilized by the item and the space around it)
//   const weeklyFee = ECM * storage.cbm;
//   const montlyFee = weeklyFee * 4;

//   return { ...item, item_CBM, total_CBM, ECM, weeklyFee, montlyFee };
// };

const calculateStorageFee = async (item: IItem, total_item_cbm: number, storage: any) => {
  const { width, length, height, qty, client, boxWidth, boxLength, boxHeight } = item;
  
  let w, l, h;

  if ((client.includes("mossodor") || client.includes("Prime Footwear")) && boxWidth && boxLength && boxHeight) {
    w = boxWidth;
    l = boxLength;
    h = boxHeight;
  } else {
    w = width;
    l = length;
    h = height;
  }

  if (!w || !l || !h || !qty) {
    return {
      ...item,
      item_CBM: 0,
      total_CBM: 0,
      ECM: 0,
      weeklyFee: 0,
      montlyFee: 0,
      problem: true,
    };
  }

  const item_CBM = (w * l * h) / 1000000; // size cbm
  let total_CBM = item_CBM * qty;

  if (total_item_cbm <= 2 && total_CBM < 2) total_CBM = 2;

  const ECM = total_CBM * storage.space; // effective cubic meter ( space utilized by the item and the space around it)
  const weeklyFee = ECM * storage.cbm;
  const montlyFee = weeklyFee * 4;

  return { ...item, item_CBM, total_CBM, ECM, weeklyFee, montlyFee };
};

const calculateTotalItemCBM = (items: any[]) => {
  // Sum up the item_CBM for all items
  const totalItemCBM = items.reduce((total, item) => {
    const { width, length, height, client, boxWidth, boxLength, boxHeight, qty } = item;

    let w, l, h;

    // Use box dimensions for certain clients if available, otherwise fallback to item dimensions
    if ((client.includes("mossodor") || client.includes("Prime Footwear")) && boxWidth && boxLength && boxHeight) {
      w = boxWidth;
      l = boxLength;
      h = boxHeight;
    } else {
      w = width;
      l = length;
      h = height;
    }

    // If any required dimension or quantity is missing, skip the item
    if (!w || !l || !h || !qty) {
      return total; // Don't add to total if the item is missing dimensions or quantity
    }

    // Calculate the item CBM (Cubic Meters)
    const item_CBM = (w * l * h) / 1000000; // Convert from cubic cm to cubic meters (1,000,000 cm³ in a m³)

    // Add the item CBM to the total, multiplying by the quantity
    return total + item_CBM * qty;
  }, 0); // Start with a total of 0

  return totalItemCBM;
};

async function importItemBySku(
  sku: string
): Promise<any[]> {
  try {
    const url = `${process.env.SELRO_API_ENDPOINT}/product?secret=${process.env.SELRO_API_SECRET}&key=${process.env.SELRO_API_KEY}&sku=${sku}`;

    //const response = await fetch(url);

const response = await fetch(url);

    if (!response.ok) {
      console.log("sku", sku);
      throw new Error(`Failed to fetch item`);
    }
    const data = (await response.json()) as any;

    return data.products as any[];
  } catch (e:any) {
    console.log(e)
    return [];
  }

}

async function fetchWithRetry(sku: string, retries: number = 3): Promise<any[]> {
  try {
    const result = await importItemBySku(sku);
    return result;
  } catch (err) {
    if (retries > 0) {
      console.log(`Retrying for ${sku}. Attempts remaining: ${retries}`);
      await new Promise(res => setTimeout(res, 50)); // Wait for 2 seconds before retrying
      return fetchWithRetry(sku, retries - 1);
    }
    // fs.appendFile('my-log-file.log',`Failed to fetch ${sku} after retries.`, (err:any) => {
    //   if (err) throw err;
    //   console.log('Log message saved to my-log-file.log');
    // });
    console.log(`Failed to fetch ${sku} after retries.`);
    return [];  // Return empty array if failed
  }
}

export const generateStorageInvoice = async (items: IItem[], isclientInvoicesFound: boolean) => {
  const StorageInvoicePerItem: Record<string, any> = {};

  let weeklySubTotal = 0;
  let monthlySubtotal = 0;
  let totalStorageSpace = 0;

  const total_item_cbm = calculateTotalItemCBM(items);
  console.log("total_item_cbm", total_item_cbm)
  // fs.appendFile('my-log-file.log',"total_item_cbm "+total_item_cbm, (err:any) => {
  //   if (err) throw err;
  //   console.log('Log message saved to my-log-file.log');
  // });
  const { storage } = (await getStorageFees()) as any;

  for (const item of items) {
    if (isclientInvoicesFound) {
     // const importedItem = await importItemBySku(item.sku) as any;
     const importedItem = await fetchWithRetry(item.sku);
      if (importedItem.length > 0) {
        item.qty = importedItem[0]["qty"];
      } else {
        item.qty = 0
      }
      // fs.appendFile('my-log-file.log'," item "+item.sku, (err:any) => {
      //   if (err) throw err;
      //   console.log('Log message saved to my-log-file.log');
      // });
    }
    const storagePerItem = await calculateStorageFee(item,total_item_cbm,storage);
    StorageInvoicePerItem[item.sku] = storagePerItem;
    weeklySubTotal += storagePerItem.weeklyFee || 0;
    monthlySubtotal += storagePerItem.montlyFee || 0;
    totalStorageSpace += storagePerItem.ECM || 0;
  }

    if (total_item_cbm <= 2) {
      // If total CBM is less than or equal to 2, distribute fees evenly across items
      weeklySubTotal = weeklySubTotal / items.length;
      monthlySubtotal = monthlySubtotal / items.length;
      totalStorageSpace = totalStorageSpace / items.length;
    }

  return {
    StorageInvoicePerItem,
    weeklySubTotal,
    monthlySubtotal,
    totalStorageSpace,
  };
};
