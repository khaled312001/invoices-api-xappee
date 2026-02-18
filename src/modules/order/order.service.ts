import { getChannelsById } from "../channel";
import { getChannelNames } from "./order.helper";
import { IOrder, Order, ImportReport } from "./order.model";

export const getOrders = async (
  from: string,
  to: string,
  channelIds: number[]
) => {
  const channels = await getChannelNames(channelIds);
  return await Order.find({
    isDeleted: false,
    date: {
      $gte: new Date(from).getTime(),
      $lte: new Date(to).getTime(),
    },
    selroChannelName: { $in: channels },
  });
};

// export const addOrders = async (orders: IOrder[]) => {
//   if (orders.length === 0) return [];

//   const bulkOps = orders.map((order) => ({
    
//     updateOne: {
//       filter: { id: order.id },
//       update: {
//         $set: order,
//       },
//       upsert: true,
//     },
//   }));

//   await Order.bulkWrite(bulkOps, {
//     ordered: false,
//     throwOnValidationError: true,
//   })
//   ;

//   // Fetch the orders from the database after bulk write
//   const updatedOrders = await Order.find({
//     id: { $in: orders.map((order) => order.id) },
//   });

//   return updatedOrders;
// };

export const getOriginalOrders = async (orders: IOrder[]) => {
  return await Order.find({
    id: { $in: orders.map((order) => order.id) },
  });
}

export const addOrders = async (orders: IOrder[],originalOrders: IOrder[]) => {
  if (orders.length === 0) return [];

  // Fetch existing orders to preserve `quantityPurchased`


  const existingOrderMap = new Map(
    originalOrders.map((order) => [order.id, order])
  );

  const bulkOps = orders.map((order) => {
    const existingOrder = existingOrderMap.get(order.id);

    const channelSales = order.channelSales.map((newSale) => {
      const existingSale =
        existingOrder?.channelSales.find((sale) => sale.id === newSale.id) || {};
      return {
        ...newSale,
        quantityPurchased: existingSale.quantityPurchased ?? newSale.quantityPurchased,
      };
    });

    const orderToUpdate = {
      ...order,
      channelSales, // Merged with existing `quantityPurchased`
    };

    return {
      updateOne: {
        filter: { id: order.id }, // Match the document by `id`
        update: {
          $set: orderToUpdate,
        },
        upsert: true,
      },
    };
  });

  // Perform the bulk write operation
  await Order.bulkWrite(bulkOps, {
    ordered: false,
    throwOnValidationError: true,
  });

  // Fetch and return the updated orders from the database
  const updatedOrders = await Order.find({
    id: { $in: orders.map((order) => order.id) },
  });

  return updatedOrders;
};


export const addOneOrder = async (order: IOrder) => {
  const newOrder = new Order({
    ...order,
    _id: undefined,
    createdAt: undefined,
    updatedAt: undefined,
  });
  return await newOrder.save();
};

export const updateOrders = async (orders: IOrder[]) => {
  const bulkOps = orders.map((order) => ({
    updateOne: {
      filter: { id: order.id },
      update: { $set: order },
      upsert: true,
    },
  }));

  return await Order.bulkWrite(bulkOps);
};

export const updateOneOrder = async (order: IOrder) => {
  return await Order.findOneAndUpdate(
    { id: order.id },
    { $set: order },
    { new: true }
  );
};

export const updateOrderWithId = async (id: string, values: any) => {
   return await Order.updateOne({ id }, { $set: values });
};

export const updateOrderQty = async (id: string, values: any) => {
  const { itemSku, itemOrderQty, channelSaleId } = values;
  return await Order.updateOne(
    { id, "channelSales.id": channelSaleId }, // Match the order and the specific channelSales item
    { $set: { "channelSales.$.quantityPurchased": Number(itemOrderQty) } } // Update the quantityPurchased in the matched array element
  );

  // // Perform the update: either update the item if it exists or add the item if it does not exist
  // const result = await Order.updateOne(
  //   { id: id, 'items.itemSku': { $ne: itemSku } },  // Only add if itemSku is not found
  //   {
  //     $push: {
  //       items: { itemSku, itemOrderQty },
  //     },
  //   }
  // );

  // if (result.modifiedCount === 0) {
  //   // Item already exists, update the itemOrderQty for the found item
  //   return await Order.updateOne(
  //     { id: id, 'items.itemSku': itemSku },
  //     { $set: { 'items.$.itemOrderQty': itemOrderQty } }
  //   );
  // }

  // return result;
  // return await Order.updateOne(
  //   {
  //     id: id, // Match the order by its ID
  //     "channelSales.sku": values.itemSku, // Ensure the channelSales array contains the matching SKU
  //   },
  //   {
  //     $set: {
  //       "channelSales.$[elem].quantityPurchased": values.itemOrderQty, // Update the matched channelSales element
  //     },
  //   },
  //   {
  //     arrayFilters: [
  //       { "elem.sku": values.itemSku }, // Array filter to target the correct element
  //     ],
  //   }
  // );
};

export const getOrdersWithId = async (ids: string[]) => {
  return await Order.find({ id: { $in: ids } }).lean();
};

export const softDeleteOrder = async (_id: string) => {
  return await Order.findByIdAndUpdate(_id, { isDeleted: true }, { new: true });
};

export const getSoftDeletedOrders = async () => {
  return await Order.find({ isDeleted: true });
};

export const restoreOrder = async (_id: string) => {
  return await Order.findByIdAndUpdate(
    _id,
    { isDeleted: false },
    { new: true }
  );
};

// reports

export const logChannelImports = async (
  from: string,
  to: string,
  channelIds: string[]
) => {
  channelIds.forEach(async (channelId) => {
    await new ImportReport({
      from: new Date(from).getTime(),
      to: new Date(to).getTime(),
      channelId,
    }).save();
  });
};

export const areOrdersAlreadyImported = async (
  from: string,
  to: string,
  channelIds: number[]
) => {
  const report = await ImportReport.find({
    from: { $gte: new Date(from).getTime() },
    to: { $lte: new Date(to).getTime() },
    channelId: { $in: channelIds },
  });
  return report;
};
