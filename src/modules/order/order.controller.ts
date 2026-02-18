import { Request, Response } from "express";
import {
  extractAllSkusFromOrders,
  filterOrders,
  fixOrders,
  importOrderWithId,
  importOrders,
  extractOrdersDataFromCsv,
  getOrderMetaData,
  validateFileType,
  handleFileHeaders,
  processCsvFile,
  processExcelFile,
} from "./order.helper";
import {
  addOrders,
  getSoftDeletedOrders,
  softDeleteOrder,
  restoreOrder,
  getOrdersWithId,
  updateOneOrder,
  updateOrderWithId,
  updateOrderQty,
  getOriginalOrders,
} from "./order.service";
import { getItemsWithSku, getOneItemWithSKU, removeOrderQuantity } from "../item";

import readline from "readline";
import { HttpError } from "../../utils/httpError";
import { getCarriers } from "../carrier/carrier.service";


export const handleImportOrders = async (req: Request, res: Response) => {
  try {
    const { from, to, channelIds } = req.body;
    console.log("from", from)
    console.log("to", to)

    if (!from || !to || !channelIds) {
      return res
        .status(400)
        .json({ message: "from, to and channelIds are required" });
    }

    const importedOrders = await importOrders(from, to, channelIds);

    const filteredOrders = filterOrders(importedOrders);
    const originalOrders =await getOriginalOrders(filteredOrders);
    const skus = extractAllSkusFromOrders(filteredOrders);
    const items = await getItemsWithSku(skus);
    const carriers = await getCarriers();
    const fixedOrders = await fixOrders(filteredOrders, items, carriers,originalOrders);
    const orders = await addOrders(fixedOrders,originalOrders);
    console
    return res.status(201).json({ orders });
  } catch (error: any) {
    console.log(error.message)
    console.log(error?.message || "No error message");
    res.status(500).json({
      message: "Something went wrong while importing orders",
      error: error?.message || "No error message",
    });
  }
};


export const handleImportOrdersCsv = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      throw new HttpError(400, "Please select a file.");
    }

    validateFileType(file);

    let data: any[];
    if (file.originalname.endsWith(".csv")) {
      const csvContent = file.buffer.toString();
      const headerStream = require('stream').Readable.from(csvContent);
      const rl = readline.createInterface({ input: headerStream, crlfDelay: Infinity });

      let headers: string[] | null = null;
      for await (const line of rl) {
        if (!headers) {
          headers = line.trim().split(",");
          handleFileHeaders(headers, "CSV");
          break;
        }
      }

      data = await processCsvFile(file);
    } else {
      data = processExcelFile(file);
    }

    const importedOrders = extractOrdersDataFromCsv(data);
    const filteredOrders = filterOrders(importedOrders);
    const originalOrders =await getOriginalOrders(filteredOrders);
    const skus = extractAllSkusFromOrders(filteredOrders);
    const items = await getItemsWithSku(skus);
    const carriers = await getCarriers();
    const fixedOrders = await fixOrders(filteredOrders, items, carriers,originalOrders);
    const orders = await addOrders(fixedOrders,originalOrders);

    const { channels, dateRange } = getOrderMetaData(orders);

    res.status(201).json({ orders, channels, dateRange });

  } catch (error: any) {
    res.status(error.status || 500).json({ message: error?.message || "No error message" });
  }
};

export const handleImportOrderWithId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json("order id is required");
    }
    const importedOrders = (await importOrderWithId(id)) as any;
    const filteredOrders = filterOrders(importedOrders);
    const originalOrders =await getOriginalOrders(filteredOrders);
    const orders = await addOrders(filteredOrders,originalOrders);
    res.status(200).json({ order: orders[0] || null });
  } catch (err: any) {
    res.status(500).json("failed to fetch order");
  }
};

export const handleSoftDeleteOrder = async (req: Request, res: Response) => {
  try {
    const { _id } = req.body;
    if (!_id) {
      res.status(400).json({ message: "_id is required" });
    }
    const order = await softDeleteOrder(_id);
    res.status(201).json({ order });
  } catch (error: any) {
    res.status(500).json({
      message: "Something went wrong while soft deleting order",
      error: error?.message || "No error message",
    });
  }
};

export const handleGetSoftDeletedOrders = async (_: Request, res: Response) => {
  try {
    const orders = await getSoftDeletedOrders();
    res.status(200).json({ orders });
  } catch (error: any) {
    res.status(500).json({
      message: "Something went wrong while getting soft deleted orders",
      error: error?.message || "No error message",
    });
  }
};

export const handleRestoreOrder = async (req: Request, res: Response) => {
  try {
    const { _id } = req.body;

    if (!_id) {
      res.status(400).json({ message: "_id is required" });
    }
    const order = await restoreOrder(_id);
    res.status(200).json({ order });
  } catch (error: any) {
    res.status(500).json({
      message: "Something went wrong while restoring order",
      error: error?.message || "No error message",
    });
  }
};

export const handleFixOneOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json("id is missingF");
    const orders = await getOrdersWithId([id]);
    const originalOrders =await getOriginalOrders(orders);
    const skus = extractAllSkusFromOrders(orders);
    const items = await getItemsWithSku(skus);
    const fixedOrders = await fixOrders(orders, items,[],originalOrders);
    const order = await updateOneOrder(fixedOrders[0]);
    res.status(200).json({ order });
  } catch (error: any) {
    res.status(500).json({
      message: "Something went wrong while fixing order",
      error: error?.message || "No error message",
    });
  }
};

export const handleUpdateOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { values } = req.body;
     console.log("values", values)

    if (!id || !values) {
      return res.status(400).json("Id and new values are required");
    }

    if (values && values.itemSku && values.itemOrderQty) {
      console.log("id", id, "values", values)
      const order: any = await getOrdersWithId([id])
      if (order) {
        order[0].channelSales.forEach(async (channelSale: any) => {
          const item = await getOneItemWithSKU(channelSale.sku);
          await updateOrderQty(id, values);
          if (item?.orderQuantity) {
            const updatedItem = await removeOrderQuantity(item.sku);
          }
        })
      }
    } else {
      await updateOrderWithId(id, values);
    }



    res.status(200).json("Order updated successfuly");
  } catch (error: any) {
    console.log(error.message)
    res.status(500).json({
      message: "Something went wrong while updating order",
      error: error?.message || "No error message",
    });
  }
};

// export const handleFixWeight = async (req: Request, res: Response) => {
//   try {
//     const { ids } = req.body;
//     if (!ids) {
//       res.status(400).json({ message: "ids are required" });
//     }

//     const orders = await getOrdersWithId(ids);

//     const skus = extractAllSkusFromOrders(orders);
//     const items = await getItemsWithSku(skus);

//     const fixedOrders = await fixOrders(orders, items);

//     await updateOrders(fixedOrders);

//     return res.status(200).json({ orders: fixedOrders });
//   } catch (error: any) {
//     res.status(500).json({
//       message: "Something went wrong while fixing weight",
//       error: error?.message || "No error message",
//     });
//   }
// };
