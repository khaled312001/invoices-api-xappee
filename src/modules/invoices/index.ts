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
  sendFulfilmentInvoiceEmail,
  handleAddCustomInvoice,
  handleGetCustomInvoices,
  handleGetCustomInvoiceById,
  handleUpdateCustomInvoice,
  handleDeleteCustomInvoice,
} from "./invoice.controller";
import multer from "multer";
import path from "path";
import { verifyAdmin } from "../../middleware/authentication.middleware";

export * from "./invoice.controller";
// Multer configuration
// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Adjust the path to point to the project's root public folder
    cb(null, path.join(process.cwd(), 'public/invoices')); // Save to the public folder at the project root
  },
  // Specify the file name
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Keep original file name
  },
});
const upload = multer({ storage: storage });


export const invoiceRouter = express.Router();
invoiceRouter.post('/save-pdf', upload.single('pdf'), handleSaveInvoiceAsPdf);


invoiceRouter.use(express.json());
invoiceRouter.post('/send-email', sendFulfilmentInvoiceEmail);
invoiceRouter.post("/generate",verifyAdmin, handleGenerateFulfillmentInvoice);

invoiceRouter.post("/custom-invoice",verifyAdmin, handleAddCustomInvoice);
invoiceRouter.get("/custom-invoices", handleGetCustomInvoices);
invoiceRouter.get("/custom-invoice/:_id", handleGetCustomInvoiceById);
invoiceRouter.put("/custom-invoice/:_id",verifyAdmin, handleUpdateCustomInvoice)
invoiceRouter.delete("/custom-invoice/:_id",verifyAdmin, handleDeleteCustomInvoice)
invoiceRouter.get("/storage/generate/:clientName",verifyAdmin, handleGenerateStorageInvoice);

invoiceRouter.get("/:client", handleGetInovices);
invoiceRouter.get("/one/:_id", handleGetInoviceById);

invoiceRouter.delete("/:_id",verifyAdmin, handleDeleteInvoice )

invoiceRouter.put("/:_id",verifyAdmin, handleUpdateInvoice)

invoiceRouter.post("/fulcharges",verifyAdmin, handleUpdateFulfilmentCharges);
invoiceRouter.get("/storage/charges",verifyAdmin, handleGetStorageFees);
invoiceRouter.post("/storgecharges",verifyAdmin, handleUpdateStorageCharges);


