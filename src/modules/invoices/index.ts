import express from "express";
import {
  handleGenerateStorageInvoice,
  handleGetInovices,
  handleGetInoviceById,
  handleDeleteInvoice,
  handleGenerateFulfillmentInvoice,
  handleUpdateInvoice,
  handleGetStorageFees,
  handleUpdateStorageCharges,
  handleUpdateFulfilmentCharges,
  handleSaveInvoiceAsPdf,
  handleGetChargesConfig,
  sendFulfilmentInvoiceEmail,
  handleAddCustomInvoice,
  handleGetCustomInvoices,
  handleGetCustomInvoiceById,
  handleUpdateCustomInvoice,
  handleDeleteCustomInvoice,
} from "./invoice.controller";
import multer from "multer";
import path from "path";
import os from "os";
import { verifyAdmin } from "../../middleware/authentication.middleware";

export * from "./invoice.controller";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir()); // Use OS temp dir instead of public/invoices for Vercel
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

export const invoiceRouter = express.Router();
invoiceRouter.post('/save-pdf', upload.single('pdf'), handleSaveInvoiceAsPdf);

invoiceRouter.use(express.json());
invoiceRouter.post('/send-email', sendFulfilmentInvoiceEmail);
invoiceRouter.post("/generate", verifyAdmin, handleGenerateFulfillmentInvoice);

invoiceRouter.post("/custom-invoice", verifyAdmin, handleAddCustomInvoice);
invoiceRouter.get("/custom-invoices", handleGetCustomInvoices);
invoiceRouter.get("/custom-invoice/:_id", handleGetCustomInvoiceById);
invoiceRouter.put("/custom-invoice/:_id", verifyAdmin, handleUpdateCustomInvoice)
invoiceRouter.delete("/custom-invoice/:_id", verifyAdmin, handleDeleteCustomInvoice)
invoiceRouter.get("/charges-config", verifyAdmin, handleGetChargesConfig);
invoiceRouter.get("/storage/generate/:clientName", verifyAdmin, handleGenerateStorageInvoice);

invoiceRouter.get("/:client", handleGetInovices);
invoiceRouter.get("/one/:_id", handleGetInoviceById);

invoiceRouter.delete("/:_id", verifyAdmin, handleDeleteInvoice)

invoiceRouter.put("/:_id", verifyAdmin, handleUpdateInvoice)

invoiceRouter.post("/fulcharges", verifyAdmin, handleUpdateFulfilmentCharges);
invoiceRouter.get("/storage/charges", verifyAdmin, handleGetStorageFees);
invoiceRouter.post("/storgecharges", verifyAdmin, handleUpdateStorageCharges);
