import express from "express";
import {
  handleAddOneItem,
  handleSearchWithSku,
  handleAddItems,
  handleGetItems,
  handleImportItemsCsv
} from ".";
import { handleDeleteItem, handleSearchWithName, handleUpdateItem } from "./item.controller";
import multer from 'multer';
import { verifyAdmin } from "../../middleware/authentication.middleware";
export * from "./item.controller";
export * from "./item.model";
export * from "./item.service";


// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


export const ItemRouter = express.Router();
ItemRouter.use(express.json());
ItemRouter.get("/", handleGetItems);
ItemRouter.post("/import/csv/:client", upload.single("file"),verifyAdmin, handleImportItemsCsv);

ItemRouter.get("/search/:sku", handleSearchWithSku);
ItemRouter.get("/searchname/:query",verifyAdmin, handleSearchWithName);

ItemRouter.post("/new",verifyAdmin, handleAddItems);
ItemRouter.post("/newone",verifyAdmin, handleAddOneItem);
ItemRouter.put("/update",verifyAdmin, handleUpdateItem);

ItemRouter.get("/delete/:_id",verifyAdmin, handleDeleteItem);
