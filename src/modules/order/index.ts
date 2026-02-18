import express from "express";
import {
  handleGetSoftDeletedOrders,
  handleImportOrders,
  handleSoftDeleteOrder,
  handleRestoreOrder,
  handleFixOneOrder,
  handleImportOrderWithId,
  handleUpdateOrder,
  handleImportOrdersCsv,
} from "./order.controller";
import multer from 'multer';
import { verifyAdmin } from "../../middleware/authentication.middleware";
export * from "./order.controller";
export * from "./order.helper";
export * from "./order.model";

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export const orderRouter = express.Router();
orderRouter.use(express.json());
orderRouter.post("/import", handleImportOrders);

orderRouter.post("/import/csv", upload.single("file"), handleImportOrdersCsv);

// orderRouter.post("/import/csv",upload.single('csvFile'),  handleImportOrdersCsv);
orderRouter.get("/import/:id", handleImportOrderWithId);
orderRouter.get("/fix/:id", handleFixOneOrder);
orderRouter.post("/soft-delete", handleSoftDeleteOrder);
orderRouter.get("/soft-deleted", handleGetSoftDeletedOrders);
orderRouter.post("/restore", handleRestoreOrder);
orderRouter.put("/:id", handleUpdateOrder);

// orderRouter.post("/fix-weight", handleFixWeight)
