import { Console } from "console";
import { csvOrderColoumns } from "../../constants/csv-columns";
import { HttpError } from "../../utils/httpError";
import { ICarrier } from "../carrier/carrier.model";
import { getCarriers } from "../carrier/carrier.service";
import { IChannel, getChannelsById } from "../channel";
import { IItem } from "../item";
const xlsx = require("xlsx");
import csv from "csvtojson";
import { getOrdersWithId } from "./order.service";

export const getOrderMetaData = (orders: any[]) => {
  let minDate = new Date(orders[0].purchaseDate);
  let maxDate = new Date(orders[0].purchaseDate);

  const channelSet = new Set<string>();

  orders.forEach((order: any) => {
    const purchaseDate = new Date(order.purchaseDate);
    if (purchaseDate < minDate) {
      minDate = purchaseDate;
    }
    if (purchaseDate > maxDate) {
      maxDate = purchaseDate;
    }

    const channel = order.channel;
    const channelName = order.selroChannelName;
    const channelCombo = JSON.stringify({ channel, channelName });

    channelSet.add(channelCombo);
  });

  const channels = Array.from(channelSet).map((channel) => JSON.parse(channel));

  return {
    dateRange: { from: minDate, to: maxDate },
    channels: channels,
  };
};

const formatDate = (date: Date) => {
  const day = date.getDate();
  const month = date.getMonth() + 1; // Months are 0-indexed, so add 1
  const year = date.getFullYear();

  // Format the date as 'M/d/yyyy'
  return `${day}/${month}/${year}` as string;
  return `${day}/${month}/${year}` as string;
};
// filters the orders data and returns the required data to store in db
// only use when importing from selro ** muliplies weight by 1000 to convert to grams
const extractOrdersData = (orders: any) => {
  return orders.map((order: any) => ({
    selroOrderId: order.id,
    id: order.orderId,
    dispatchDate: order.dispatchDate,
    purchaseDate: order.purchaseDate,
    lastUpdateDate: order.lastUpdateDate,
    shippedDate: order.shippedDate,
    channel: order.channel,
    selroChannelName: order.selroChannelName,
    totalPrice: order.totalPrice,
    trackingNumber: order.trackingNumber,
    carrierName: order.carrierName,
    shippingMethod: order.shippingMethod,
    // mixed array of orders
    channelSales: order.channelSales.map((channelSale: any) => ({
      id: channelSale.id,
      cahnnelOrderId: channelSale.channelOrderId,
      orderId: channelSale.orderId,
      channel: channelSale.channel,
      sku: channelSale.sku,
      inventorysku: channelSale.inventorysku,
      ean: channelSale.ean,
      quantityPurchased: channelSale.quantityPurchased,
      orderStatus: channelSale.orderStatus,
      weight: channelSale.weight * 1000,
      itemPrice: channelSale.itemPrice,
      totalPrice: channelSale.totalPrice,
      itemTax: channelSale.itemTax,
      shipCountry: channelSale.shipCountry,
      trackingNumber: channelSale.trackingNumber,
      shipPostalCode: channelSale.shipPostalCode,
      ofaPostCode: channelSale.shipPostalCode,
      shippingMethod: channelSale.shippingMethod,
      bundleskus: channelSale.bundleskus,
      height: channelSale.height,
      width: channelSale.width,
      length: channelSale.length,
      customItemTitle: channelSale.customItemTitle,
    })),
    channelSalesLength: order.channelSales.length,

    shipPostalCode: order.shipPostalCode,
    totalWeight: Number(order.totalWeight * 1000),
  }));
};

async function importOrdersForChannel(
  from: string,
  to: string,
  channelId: number
): Promise<any[]> {
  const url = `${process.env.SELRO_API_ENDPOINT}/orders?secret=${process.env.SELRO_API_SECRET}&key=${process.env.SELRO_API_KEY}&from_date=${from}&to_date=${to}&channel_id=${channelId}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch orders for channel ${channelId}`);
  }

  const data = (await response.json()) as any;
  return data.orders as any[];
}

export const importOrderWithId = async (id: string) => {
  const url = `${process.env.SELRO_API_ENDPOINT}/order?secret=${process.env.SELRO_API_SECRET}&key=${process.env.SELRO_API_KEY}&order_id=${id}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch order ${id}`);
  }

  const data = (await response.json()) as any;
  const orders = extractOrdersData(data.orders);

  return orders as any[];
};
export const importOrders = async (
  from: any,
  to: any,
  channelIds: number[]
) => {
  const fetchPromises = channelIds.map((channelId: number) =>
    importOrdersForChannel(from, to, channelId)
  );

  const ordersResults = await Promise.all(fetchPromises);

  // Flatten the array of order arrays
  const allOrders = ordersResults.flat();

  // Store orders in database
  const orders = extractOrdersData(allOrders);
  return orders;
};
// order.trackingNumber &&
export const filterOrders = (orders: any[]) => {
  return orders.filter(
    (order: any) =>
      (order.trackingNumber || (order.trackingNumber == null && order.carrierName)) &&
      order.channelSales[0].orderStatus !== "Canceled" &&
      order.channelSales[0].orderStatus !== "cancelled" &&
      order.channelSales[0].orderStatus !== "canceled"
  );
};

export const getChannelNames = async (channelIds: number[]) => {
  const channels = await getChannelsById(channelIds);
  return channels.map((channel: IChannel) => channel.name);
};


const fixSkuProblems = (input: string) => {
  let editedSku = String(input);
  // const fbxPrefix = 'FBX-';
  // if (editedSku.startsWith(fbxPrefix)) {
  //   editedSku = editedSku.slice(fbxPrefix.length);
  // }

  const RSuffix = 'R';
  if (editedSku.endsWith(RSuffix)) {
    editedSku = editedSku.slice(0, -RSuffix.length);
  }

  const fbaPrefix = 'FBA-';
  if (editedSku.startsWith(fbaPrefix)) {
    editedSku = editedSku.slice(fbaPrefix.length);
  }

  const fbaSuffix = '_FBA';
  if (editedSku.endsWith(fbaSuffix)) {
    editedSku = editedSku.slice(0, -fbaSuffix.length);
  }

  if (editedSku.includes('vv') || editedSku.includes('VV')) {
    editedSku = editedSku.replace(/([vV])(?=.*[vV])/g, '');
  }

  // if (editedSku.toUpperCase().startsWith('IXL')) {
  //   editedSku = editedSku.replace(/(IXL\d+)[xX].*$/i, '$1');
  // } else if (editedSku.includes('x') || editedSku.includes('X') || editedSku.includes('_x') || editedSku.includes('_X')) {
  //   editedSku = editedSku.replace(/[xX](_[xX])?(_)?.*$/, '');
  //   if (editedSku.endsWith('_')) {
  //     editedSku = editedSku.slice(0, -1);
  //   }
  // }

  // if (editedSku.includes('x') || editedSku.includes('X') || editedSku.includes('_x') || editedSku.includes('_X')) {
  //   editedSku = editedSku.replace(/[xX](_[xX])?(_)?.*$/, '');
  //   if (editedSku.endsWith('_')) {
  //     editedSku = editedSku.slice(0, -1);
  //   }
  // }
  return editedSku;
};

export const fixOrders = async (
  orders: any[],
  items: IItem[],
  carriers?: ICarrier[],
  originalOrders?: any[]
): Promise<any[]> => {
  // Create a map of items for quick lookup by SKU
  const itemsMap = new Map(items.map((item) => [item.sku, item]));

  // Process each order to fix its channel sales and total weight
  const fixedOrders = orders.map((order) => {
    let totalItems = 0;
    let orderMinParcels = 0;
    let orderMaxParcels = 0;
    let orderTotalQunatity = 0;

    let totalWeight = order.totalWeight ?? 0; // Start with existing totalWeight or 0 if not present

    let orderSalesTrackingNumbers: any[] = [];
    const fixedChannelSales = order.channelSales.map((sale: any) => {

      let saleWeight = sale.weight ?? 0; // Use existing sale weight or 0 if not present

      // const item = itemsMap.get(fixSkuProblems(sale.sku)); // Get item from map by SKU
      const item = itemsMap.get(sale.sku); // Get item from map by SKU


      //       if (!item) {
      //         console.log(fixSkuProblems(sale.sku), "not found in items");
      //       }
      // if(order.id == "08-11576-78762"){
      //   console.log(item)
      //   console.log(fixSkuProblems(sale.sku), " fdedsfdf");
      // }
      let itemQuantityPurchased = sale.quantityPurchased ?? 0;
      if (!orderSalesTrackingNumbers.includes(sale.trackingNumber)) {
        const originalOrder = originalOrders?.find((o: any) => o.id === order.id);
        if (originalOrder) {
          const originalChannelSale = originalOrder.channelSales.find((s: any) => s.id === sale.id);
          if(originalChannelSale){
             itemQuantityPurchased = originalChannelSale.quantityPurchased ?? sale.quantityPurchased;
        }
      }
     
       
        if (totalWeight === 0 || saleWeight === 0) {
          if (item) {

            saleWeight = item.weight * Number(itemQuantityPurchased); // Update sale weight from item
            totalWeight += saleWeight * Number(itemQuantityPurchased); // Add to total weight
          }
        }

        if (order.totalWeight && order.totalWeight !== totalWeight) {
          totalWeight = order.totalWeight;
        }
        sale.sku = String(sale.sku)


        // if(order.carrierName?.toLowerCase() != "parcelforce"){
        //   const isBundle = (sale.sku.includes('x') || sale.sku.includes('X') || sale.sku.includes('_x') || sale.sku.includes('_X'));
        //   if (isBundle) {
        //     const bundleQty = sale.sku.split('x') || sale.sku.split('X');
        //     const bundleQtyValue = Number(bundleQty[1]);
        //     if (!isNaN(bundleQtyValue)) {
        //       itemQuantityPurchased = Number(sale.quantityPurchased || 1) * bundleQtyValue ?? 1;
        //     }
        //   }
        // }

        totalItems += itemQuantityPurchased * (item?.items ?? sale.items ?? 1);
        orderTotalQunatity += itemQuantityPurchased;
        orderMaxParcels += item?.maxParcels ?? 1;
        orderMinParcels += (item?.parcels ?? sale.parcels ?? 1);

        orderSalesTrackingNumbers.push(sale.trackingNumber);
      }


      // Return updated sale info
      return {
        ...sale,
        weight: saleWeight, // Update with new or existing weight
        class: item?.class ?? sale.class,
        items: item?.items ?? sale.items ?? 1,
        parcels: item?.parcels ?? sale.parcels ?? 1,
        maxParcels: item?.maxParcels ?? 1,
        width: sale.width ?? item?.width,
        height: sale.height ?? item?.height,
        length: sale.length ?? item?.length,
        boxWidth: item?.boxWidth,
        boxHeight: item?.boxHeight,
        boxLength: item?.boxLength,
        skipFees: item?.skipFees,
        client: item?.client
      };
    });

    const totalOrderParcels = Math.ceil(orderTotalQunatity / orderMaxParcels) * orderMinParcels;


    if (carriers) {
      if (order.carrierName && order.carrierName.toLowerCase() == 'royal-mail') {
        order.carrierName = "Royal mail";
      }

      if (order.carrierName && totalOrderParcels >= 2) {
        const carrier = carriers.find(
          (c) => c.name.toLowerCase() === order.carrierName.toLowerCase()
        );
        if (carrier) {
          const orderShippingMethod =
            order.shippingMethod.split("|")[1] ?? order.shippingMethod;

          const service = carrier?.services.find(
            (s) => s.name.toLowerCase() === orderShippingMethod.toLowerCase()
          );

          if (service && carrier.name == 'parcelforce' && (service.name == 'express48/SUP' || service.name == 'express24/SND')) {
            order.shippingMethod = service.name + '+'
          }
        }
      }
    }


    // Return the order with updated totalWeight and channelSales
    return {
      ...order,
      totalWeight, // Use the calculated total weight
      channelSales: fixedChannelSales, // Use the fixed channel sales
      totalItems: totalItems,
      orderTotalItemsQunatity: orderTotalQunatity,
      orderMaxParcels: orderMaxParcels,
      orderMinParcels: orderMinParcels,
      totalOrderParcels: totalOrderParcels
    };
  });
  // Return the array of fixed orders

  return fixedOrders;
};

export const extractAllSkusFromOrders = (orders: any[]): string[] => {
  // Flatten and map orders to their SKUs, extracting the string value
  const allSkus = orders.reduce<string[]>((accumulator, order) => {

    const skusFromOrder = order.channelSales.map(
      ({ sku }: { sku: string }) => fixSkuProblems(sku)
    ); // Corrected to extract sku string

    return accumulator.concat(skusFromOrder); // Combine current order SKUs with accumulator
  }, []);

  return allSkus;
};

export const extractOrdersDataFromCsv = (orders: any) => {
  let ordersDataMap = new Map<string, any>();

  orders.forEach((channelSale: any) => {
    const selroOrderId = channelSale["SELRO_ORDER_ID"];
    const item: any = {
      id: channelSale["SELRO_ORDER_ID"],
      cahnnelOrderId: channelSale["SELRO_ORDER_ID"],
      orderId: channelSale["ORDER_ID"],
      channel: channelSale["CHANNEL"],
      sku: channelSale["SKU"],
      inventorysku: channelSale["SKU"],
      ean: channelSale["EAN"] ? channelSale["EAN"] : null,
      quantityPurchased: channelSale["QUANTITY_PURCHASED"],
      orderStatus: channelSale["ORDER_STATUS"]
        ? channelSale["ORDER_STATUS"].toLowerCase()
        : null,
      weight: channelSale.WEIGHT * 1000,
      itemPrice: Number(channelSale["ITEM_PRICE"]),
      totalPrice: Number(channelSale["LINE_ITEM_TOTAL"]),
      itemTax: channelSale["ITEM_TAX"],
      shipCountry: channelSale["SHIP_COUNTRY"],
      trackingNumber: channelSale["TRACKING_ID"],
      shipPostalCode: channelSale["SHIP_POSTALCODE"],
      ofaPostCode: channelSale["SHIP_POSTALCODE"],
      shippingMethod: channelSale["SHIPPING_METHOD"],
      // bundleskus: channelSale.bundleskus,
      height: channelSale.height,
      width: channelSale.width,
      length: channelSale.length,
      customItemTitle: channelSale["TITLE"],
    };

    if (ordersDataMap.has(selroOrderId)) {
      let order = ordersDataMap.get(selroOrderId);
      order.channelSales.push(item);
      order.totalWeight += item.weight;
    } else {
      let order = {
        orderId: channelSale["SELRO_ORDER_ID"],
        selroOrderId: channelSale["SELRO_ORDER_ID"],
        id: channelSale["SELRO_ORDER_ID"],
        dispatchDate: channelSale["EXPECTED DISPATCH DATE"]
          ? new Date(channelSale["EXPECTED DISPATCH DATE"]).getTime()
          : null,
        purchaseDate: channelSale["ORDER_DATE"]
          ? new Date(channelSale["ORDER_DATE"]).getTime()
          : null,
        // lastUpdateDate: channelSale.lastUpdateDate,
        shippedDate: channelSale["SHIPPED_DATE"]
          ? new Date(channelSale["SHIPPED_DATE"]).getTime()
          : null,
        channel: channelSale["CHANNEL"],
        selroChannelName: channelSale["CHANNEL_NAME"],
        totalPrice: channelSale["ORDER_TOTAL"],
        trackingNumber: channelSale["TRACKING_ID"]
          ? channelSale["TRACKING_ID"]
          : null,
        carrierName: channelSale["SHIPPING_CARRIER"]
          ? channelSale["SHIPPING_CARRIER"]
          : null,
        shippingMethod: channelSale["SHIPPING_METHOD"],
        channelSales: [item],
        shipPostalCode: channelSale["SHIP_POSTALCODE"],
        totalWeight: Number(item.weight),
      };
      ordersDataMap.set(selroOrderId, order);
    }
  });

  let ordersData = Array.from(ordersDataMap.values());
  return ordersData;
};


export const handleFileHeaders = (headers: string[] | null, fileType: string): void => {
  if (!headers) {
    throw new HttpError(400, `Failed to read ${fileType} headers.`);
  }
  const sanitizeHeader = (header: string) => header.replace(/^"|"$/g, '').trim();

  // Sanitize the input headers
  const sanitizedHeaders = headers.map(sanitizeHeader);
  console.log("Sanitized Headers:", sanitizedHeaders);

  console.log("csvOrderColoumns", headers)
  const missingColumns = csvOrderColoumns.filter(col => {
    // console.log(col)
    // console.log(col.replace(/^"|"$/g, '').trim())
    return !sanitizedHeaders.includes(col);
  });
  console.log("missingColumns", missingColumns)
  if (missingColumns.length > 0) {
    throw new HttpError(400, `Missing columns: ${missingColumns.join(", ")}`);
  }
};

export const processCsvFile = async (file: Express.Multer.File): Promise<any[]> => {
  const csvContent = file.buffer.toString();
  const data = await csv().fromString(csvContent);
  return data;
};

export const processExcelFile = (file: Express.Multer.File): any[] => {
  const workbook = xlsx.read(file.buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = xlsx.utils.sheet_to_json(sheet, {
    header: 1, defval: '', blankrows: true, raw: false, dateNF: 'd"/"m"/"yyyy'
  });

  const headers = jsonData[0];
  handleFileHeaders(headers, "Excel");

  return jsonData.slice(1).map((row: any[]) => {
    const obj: { [key: string]: any } = {};
    headers.forEach((header: string, index: number) => {
      obj[header] = row[index];
    });
    return obj;
  });
};

export const validateFileType = (file: Express.Multer.File): void => {
  const fileExtension = file.originalname.split(".").pop();
  if (!["csv", "xlsx", "xls"].includes(fileExtension!)) {
    throw new HttpError(400, "Please upload a CSV or xlsx file.");
  }
};
