import { Request, Response } from "express";
import {
  addItems,
  addOneItem,
  deleteItem,
  getItems,
  getItemsWithName,
  getOneItemWithSKU,
  updateItem,
} from "./index";
import { HttpError } from "../../utils/httpError";
import csv from "csvtojson";
import fs from "fs";
import readline from "readline";
import { csvItemColumns } from "../../constants/csv-columns";
import { extractItemsFromCsv, handleFileHeaders, processCsvFile, processExcelFile, validateFileType } from "./item.helper";

export const handleAddItems = async (req: Request, res: Response) => {
  try {
    const { newItems, client } = req.body;

    if (!client) return res.status(400).json({ message: "No client provided" });

    if (!newItems || newItems.length === 0)
      return res.status(400).json({ message: "No new items provided" });

    const items = await addItems(newItems, client);
    res.status(201).json({ items });
  } catch (error: any) {
    res.status(500).json({
      message: "Somehting went wrong while addin new itme",
      error: error?.message || "No error message",
    });
  }
};

export const handleAddOneItem = async (req: Request, res: Response) => {
  try {
    const { newItem } = req.body;
    if (!newItem) {
      res.status(400).json({ message: "No new items provided" });
    }
    const item = await addOneItem(newItem);
    res.status(201).json({ item });
  } catch (error: any) {
    console.log(error.message)
    res.status(500).json({
      message: "Something went wrong while adding new item",
      error: error?.message || "No error message",
    });
  }
};

export const handleGetItems = async (req: Request, res: Response) => {
  try {
    const { page, pageSize } = req.query;
    if (!page || !pageSize) {
      res.status(400).json({ message: "Page and pageSize are required" });
    }
    const user = req.user;
    const items = await getItems(Number(page), Number(pageSize), user);
    return res.status(200).json({ items });
  } catch (error: any) {
    res.status(500).json({
      message: "Something went wrong while getting items",
      error: error?.message || "No error message",
    });
  }
};

export const handleSearchWithSku = async (req: Request, res: Response) => {
  try {
    const { sku } = req.params;
    const user = req.user;
    if (!sku) {
      res.status(400).json({ message: "SKU is required" });
    }
    const item = await getOneItemWithSKU(sku,user);
    return res.status(200).json({ item });
  } catch (error: any) {
    res.status(500).json({
      message: "Something went wrong while searching for item",
      error: error?.message || "No error message",
    });
  }
};

export const handleSearchWithName = async (req: Request, res: Response) => {
  try {
    const { query } = req.params;
    if (!query) {
      res.status(400).json({ message: "SKU is required" });
    }
    const items = await getItemsWithName(encodeURIComponent(query));
    console.log("itemssssssss",items);
    return res.status(200).json({ items });
  } catch (error: any) {
    res.status(500).json({
      message: "Something went wrong while searching for item",
      error: error?.message || "No error message",
    });
  }
};

export const handleDeleteItem = async (req: Request, res: Response) => {
  try {
    const { _id } = req.params;
    if (!_id) {
      res.status(400).json({ message: "_id is required" });
    }
    await deleteItem(_id);
    return res.status(200).json({ message: "item deleted" });
  } catch (error: any) {
    console.log("tttttttt",error.message)
    res.status(500).json({
      message: "Something went wrong while deleting item",
      error: error?.message || "No error message",
    });
  }
};

export const handleUpdateItem = async (req: Request, res: Response) => {
  try {
    const { item } = req.body;
    if (!item) {
      return res.status(400).json({ message: "item is required" });
    }
    const updatedItem = await updateItem(item);
    return res.status(200).json({ item: updatedItem });
  } catch (error: any) {
    res.status(500).json({
      message: "Something went wrong while updating item",
      error: error?.message || "No error message",
    });
  }
};

// export const handleImportItemsCsv = async (req: Request, res: Response) => {
//   try {
//     const file = req.file;
//     const { client } = req.params;

//     console.log(file)
//     if (!client) {
//       throw new HttpError(400, "Please provide a client name.");
//     }
//     if (!file) {
//       throw new HttpError(400, "Please select a file.");
//     }
//     if (!file.originalname.endsWith(".csv")) {
//       throw new HttpError(400, "Please upload a CSV file.");
//     }

//     // Validate the columns names
//     const csvFilePath = file.path;
//     let headers: string[] | null = null;
//     const headerStream = fs.createReadStream(csvFilePath);
//     const rl = readline.createInterface({
//       input: headerStream,
//       crlfDelay: Infinity,
//     });

//     rl.on("line", (line) => {
//       if (!headers) {
//         headers = line.trim().split(",");
//         rl.close();
//       }
//     });
//     rl.on("close", async () => {
//       try {
//         if (!headers) {
//           throw new HttpError(400, "Failed to read CSV headers.");
//         }

//         const missingColumns = csvItemColumns.filter(
//           (col) => !headers!.includes(col)
//         );
//         if (missingColumns.length > 0) {
//           throw new HttpError(
//             400,
//             `Missing columns: ${missingColumns.join(", ")}`
//           );
//         }

//         // Convert CSV data to JSON and process
//         const data = await csv().fromFile(csvFilePath);
//         const items = extractItemsFromCsv(data);
//         const addedItems = await addItems(items, client);
//         // Delete the file after processing
//         fs.unlink(csvFilePath, (err) => {
//           if (err) {
//             console.error(`Failed to delete file: ${csvFilePath}`, err);
//           } else {
//             console.log(`File deleted: ${csvFilePath}`);
//           }
//         });

//         // Respond with processed orders
//         res.status(201).json({ items: addedItems });
//       } catch (error: any) {
//         res.status(error.status || 500).json({
//           message: error?.message || "No error message",
//         });
//       }
//     });
//   } catch (error: any) {
//     console.log(error.message);
//     res.status(error.status || 500).json({
//       message: error?.message || "No error message",
//     });
//   }
// };


export const handleImportItemsCsv = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { client } = req.params;

    if (!client) {
      throw new HttpError(400, "Please provide a client name.");
    }
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

    const items = extractItemsFromCsv(data);
    const addedItems = await addItems(items, client);
    res.status(201).json({ items: addedItems });

  } catch (error: any) {
    console.log(error.message);
    res.status(error.status || 500).json({
      message: error?.message || "No error message",
    });
  }
};
