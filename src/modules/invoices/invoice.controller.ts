import { Request, Response } from "express";
import { getOrdersWithId } from "../order/order.service";
import { filterOrders, fixOrders } from "../order";
import { generateStorageInvoice } from "./invoice.helper";
import {
  addNewFulfillmentInvoice,
  addNewStorageInvoice,
  getStorageInvoices,
  deleteStorageInvoiceById,
  deleteFulfillmentInvoiceById,
  updateStorageInvoiceById,
  updateFulfillmentInvoiceById,
  getFulfillmentInvoices,
  getStorageInvoiceById,
  getFulfillmentInvoiceById,
  getStorageInvoicesCount,
  getCustomInvoices,
  getCustomInvoiceById,
  updateCustomInvoice,
  calculateSubtotal,
  calculateDiscount,
  calculateTax,
  calculateTotal,
  deleteCustomInvoiceById,
} from "./invoice.service";
import { getItemsWithClient } from "../item";
import { calculateFulfillmentInovice } from "./fulfillmentInvoiceHelper";
import { Client, getClientWithEmail, getClientWithName } from "../client";
import { Carrier } from "../carrier/carrier.model";
import { getFees, getStorageFees } from "../fee/fee.service";
import { Fee } from "../fee/fee.model";
import path from "path";
import fs from 'fs';
import nodemailer from 'nodemailer';
import { CustomInvoice } from "./invoice.model";

export const handleGenerateFulfillmentInvoice = async (
  req: Request,
  res: Response
) => {
  try {
    const { ids, dateRange, channels, clientName, expenseCause, expenseValue } = req.body;

    if (!ids) {
      return res.status(400).json({ message: "ids are required" });
    }

    const client = await getClientWithName(clientName);
    if (!client) return res.status(400).json("client not found");

    const orders = await getOrdersWithId(ids);
    const filteredOrders = filterOrders(orders); // ignore cancelled and unshipped orders
    const { InvoiceByOrder, InvoiceByService, problems, totals } =
      await calculateFulfillmentInovice(filteredOrders);
    const invoice = await addNewFulfillmentInvoice(
      dateRange,
      channels,
      InvoiceByOrder,
      InvoiceByService,
      clientName,
      client.email,
      client.address ?? '',
      client.busineesName ?? '',
      problems,
      totals,
      expenseCause,
      expenseValue
    );
    res.status(200).json({
      _id: invoice._id,
      InvoiceByOrder,
      InvoiceByService,
      dateRange,
      channels,
      problems,
      client: client.name,
      clientEmail: client.email,
      clientAddress: client.address,
      totals,
      createdAt: invoice.createdAt,
      expenseCause,
      expenseValue
    });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).json({
      message: "Something went wrong while generating invoice",
      error: error?.message || "No error message",
    });
  }
};

export const handleGenerateStorageInvoice = async (
  req: Request,
  res: Response
) => {
  try {
    const { clientName } = req.params;
    const { from, to } = req.query;
    fs.appendFile('my-log-file.log', "innnn ", (err: any) => {
      if (err) throw err;
      console.log('Log message saved to my-log-file.log');
    });
    if (!from || !to || !clientName)
      return res.status(400).json("date range is required");

    const client = await getClientWithName(clientName);
    if (!client) return res.status(400).json("client not found");
    const oldStorageInvoices = await getStorageInvoicesCount(client.name);
    const storageInvoices = await getStorageInvoicesCount(client.name);
    const items = await getItemsWithClient(clientName);

    const {
      StorageInvoicePerItem,
      monthlySubtotal,
      weeklySubTotal,
      totalStorageSpace,
    } = await generateStorageInvoice(items, storageInvoices.exists);

    const invoice = await addNewStorageInvoice(
      from,
      to,
      clientName,
      client.email,
      client.address ?? '',
      client.busineesName ?? '',
      StorageInvoicePerItem,
      monthlySubtotal,
      weeklySubTotal,
      totalStorageSpace
    );

    return res.status(200).json({
      _id: invoice._id,
      StorageInvoicePerItem,
      from,
      to,
      client: client.name,
      clientEmail: client.email,
      monthlySubtotal,
      weeklySubTotal,
      totalStorageSpace,
      createdAt: invoice.createdAt,
      items: invoice.items,
      storageStartMonth: oldStorageInvoices.exists
    });
  } catch (err: any) {
    fs.appendFile('my-log-file.log', "error storage " + err.message + "\n", (err: any) => {
      if (err) throw err;
      console.log('Log message saved to my-log-file.log');
    });
    console.log(err.message);

    return res
      .status(500)
      .json({ message: "somethign went worng.", error: err });
  }
};

export const handleGetInovices = async (req: Request, res: Response) => {
  try {
    const { client } = req.params;
    const user: any = req.user;

    if (!client) {
      return res.status(200).json("no client provided");
    }
    if (user && user.role !== "admin" && client != user.client) {
      return res.status(401).json({ error: "Forbidden" });
    }
    const fullfillmentInvoices = await getFulfillmentInvoices(client);
    const storageInvoices = await getStorageInvoices(client);
    return res
      .status(200)
      .json({ invocies: { fullfillmentInvoices, storageInvoices } });
  } catch (err: any) {
    res.status(500).json({ message: "something went wrong", error: err });
  }
};

export const handleGetInoviceById = async (req: Request, res: Response) => {
  try {
    const { _id } = req.params;
    const { type } = req.query;
    const user: any = req.user;
    if (type === "storage") {
      const invoice = await getStorageInvoiceById(_id);

      const client = await getClientWithEmail(invoice!["clientEmail"]);
      console.log("client", client);
      if (user && user.role !== "admin" && invoice?.client != user.client) {
        return res.status(401).json({ error: "Forbidden" });
      }
      const oldStorageInvoices = await getStorageInvoicesCount(client!.name);
      res.status(200).json({ invoice: { ...invoice, storageStartMonth: oldStorageInvoices.exists } });

    } else {
      const invoice = await getFulfillmentInvoiceById(_id);
      if (user && user.role !== "admin" && invoice?.client != user.client) {
        return res.status(401).json({ error: "Forbidden" });
      }
      res.status(200).json({ invoice });
    }

  } catch (err: any) {
    res.status(500).json({ message: "error getting invoice", error: err });
  }
};

export const handleDeleteInvoice = async (req: Request, res: Response) => {
  try {
    const { _id } = req.params;
    const { type } = req.query;

    if (type === "storage") {
      await deleteStorageInvoiceById(_id);
      res.status(200).json("deleted");
    } else {
      await deleteFulfillmentInvoiceById(_id);
      res.status(200).json("deleted");
    }
  } catch (err: any) {
    res.status(500).json({ message: "error getting invoice", error: err });
  }
};

export const handleUpdateInvoice = async (req: Request, res: Response) => {
  try {
    const { _id } = req.params;
    const { type } = req.query;
    const { invoice } = req.body;

    if (type === "storage") {
      await updateStorageInvoiceById(_id, invoice);
      res.status(200).json("deleted");
    } else {
      await updateFulfillmentInvoiceById(_id, invoice);
      res.status(200).json("deleted");
    }
  } catch (err: any) {
    res.status(500).json({ message: "error getting invoice", error: err });
  }
};

// export const handleUpdateFulfilmentCharges = async (req: Request, res: Response) => {
//   try {
//     console.log("req", req.body)
//     const { newCharges } = req.body;
// console.log("newCharges",newCharges)
//     // Iterate over each carrier in the formState
//     for (const carrierName in newCharges) {
//       const carrierServices = newCharges[carrierName];

//       if (carrierName === "parcelforce" && carrierServices.discount) {
//         const discount = parseFloat(carrierServices.discount);
//         if (!isNaN(discount) && discount >= 0) {
//           console.log(carrierName, "discount", discount);
//           // Update the discount for ParcelForce
//           await Carrier.updateOne(
//             { name: carrierName },
//             { $set: { discount: discount } }
//           );
//         }
//       }

//       // Iterate over each service in the carrier
//       for (const serviceName in carrierServices) {
//         const charges = carrierServices[serviceName];
//         const numericCharges: any = {};
//         for (const weight in charges) {
//           const numericValue = parseFloat(charges[weight]);
//           if (!isNaN(numericValue) && numericValue > 0) {
//             numericCharges[weight] = numericValue;
//           }
//         }
//         console.log(carrierName, serviceName, "numericCharges", numericCharges)
//         // Update the charges for the specific service within the carrier
//         await Carrier.updateOne(
//           { name: carrierName, 'services.name': serviceName },
//           { $set: { 'services.$.charges': numericCharges } }
//         );
//       }
//     }

//     res.status(201).json({ message: 'Charges updated successfully' });

//   } catch (error: any) {
//     res.status(500).json({
//       message: "Somehting went wrong while updating charges",
//       error: error?.message || "No error message",
//     });
//   }
// };
const isEmpty = function (obj: any) {
  console.log("obj", obj)
  return Object.keys(obj).length === 0;
};
export const handleUpdateFulfilmentCharges = async (req: Request, res: Response) => {
  try {
    const { newCharges } = req.body;

    for (const carrierName in newCharges) {
      const carrierServices = newCharges[carrierName];

      // Check if carrier already exists or is new
      let carrier = await Carrier.findOne({ name: carrierName });
      if (!carrier) {
        // If the carrier doesn't exist, create a new one
        carrier = new Carrier({
          name: carrierName,
          services: [] // Initialize with an empty services array
        });

        if (carrierServices.discount) {
          const discount = parseFloat(carrierServices.discount);
          if (!isNaN(discount)) {
            carrier.discount = discount; // Add discount if provided
          }
        }

        // Filter and add valid services
        const validServices = carrierServices.services.filter((service: { name: string; charges: {}; }) => {
          // Check that the service has a name and charges are present
          if (!service.name || !service.charges) {
            return false;
          }

          // Ensure all values in charges are non-empty
          const chargesValues = Object.values(service.charges);
          const hasValidCharges = chargesValues.every(value => value !== '') && !isEmpty(service.charges);

          return hasValidCharges; // Return true only if charges have valid values
        });

        if (validServices.length > 0) {
          carrier.services.push(...validServices);
          await carrier.save();
        }

      }
      else {
        // Update existing carrier's services and charges
        for (const serviceName in carrierServices) {
          const charges = carrierServices[serviceName];
          const numericCharges: any = {};
          for (const weight in charges) {
            const numericValue = parseFloat(charges[weight]);
            if (!isNaN(numericValue) && numericValue > 0) {
              numericCharges[weight] = numericValue;
            }
          }
          // Update the charges for the specific service within the carrier
          await Carrier.updateOne(
            { name: carrierName, 'services.name': serviceName },
            { $set: { 'services.$.charges': numericCharges } }
          );
        }
      }
    }

    res.status(201).json({ message: 'Charges updated successfully' });
  } catch (error: any) {
    console.log(error.message)
    res.status(500).json({
      message: "Something went wrong while updating charges",
      error: error?.message || "No error message",
    });
  }
};


export const handleGetStorageFees = async (req: Request, res: Response) => {
  try {
    const { storage } = await getStorageFees();
    return res.status(200).json({ storage });
  } catch (error: any) {
    res.status(500).json({
      message: "Something went wrong while getting storage fees",
      error: error?.message || "No error message",
    });
  }
}

export const handleUpdateStorageCharges = async (req: Request, res: Response) => {
  try {
    const { cbm, space } = req.body.newCharges;
    const stoageFees = await Fee.findOne().sort({ createdAt: -1 });

    if (!stoageFees) {
      return res.status(400).json({ message: "No storage fees found" });
    }
    await Fee.findByIdAndUpdate(
      stoageFees._id,
      {
        $set: {
          'storage.cbm': parseFloat(cbm),
          'storage.space': parseFloat(space),
          updatedAt: new Date() // Update the timestamp
        }
      },
      { new: true } // Return the updated document
    );

    res.status(201).json({ message: 'Charges updated successfully' });

  } catch (error: any) {
    console.log(error.message)
    res.status(500).json({
      message: "Somehting went wrong while updating charges",
      error: error?.message || "No error message",
    });
  }
};


export const handleSaveInvoiceAsPdf = async (req: Request, res: Response) => {
  try {
    // const form = new formidable.IncomingForm();
    // form.parse(req, (err:any, fields:any, files:any) => {
    //   if (err) {
    //     console.log(err.message)
    //     return res.status(500).json({ error: 'Failed to parse form data' });
    //   }
    //   // Define the path where the file should be saved
    //   //const filePath = path.join(process.env.SERVER!, 'public', files.pdf.originalFilename);

    //   // Move the uploaded file to the public folder
    //   // fs.rename(files.pdf.filepath, filePath, (err) => {
    //   //   if (err) {
    //   //     return res.status(500).json({ error: 'Failed to save PDF' });
    //   //   }

    res.status(200).json({ message: 'PDF saved successfully!' });
    // });
    // });
  } catch (error: any) {
    res.status(500).json({
      message: "Something went wrong while saving the PDF",
      error: error?.message || "No error message",
    });
  }
}

export const sendFulfilmentInvoiceEmail = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { userEmail, invoice, emailHtml, subject, formData } = req.body;

    if (!userEmail || !invoice) {
      return res.status(400).json({ error: "Missing required fields" });
    }



    // Create a Nodemailer transporter
    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_USER_PASSWORD,
      },
      logger: false,
      debug: false,
    });


    const pdfFileName = `Invoice_${invoice._id}.pdf`; // Adjust the naming convention if needed
    const pdfFilePath = path.join(process.cwd(), 'public/invoices', pdfFileName);

    // Send email
    let info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: userEmail,
      subject: subject ?? "FBX INVOICE REMINDER",
      text: subject ?? "FBX INVOICE REMINDER",
      html: emailHtml,
      attachments: [
        {
          filename: pdfFileName,
          path: pdfFilePath,
          contentType: 'application/pdf',
        },
      ],
    });

    fs.unlink(pdfFilePath, (err) => {
      if (err) {
        console.error(`Error deleting the file: ${err}`);
      }
    });


    res.status(200).json({ messageId: info.messageId });
    // return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (err: any) {
    console.error("Error sending email:", err);
    res.status(500).json({
      message: "Failed to send email",
      error: err?.message || "No error message",
    });

    // return NextResponse.json(
    //   { error: "Failed to send email" },
    //   { status: 500 }
    // );
  }
}

export const handleAddCustomInvoice = async (
  req: Request,
  res: Response
) => {
  try {
    console.log("req.body", req.body);
    const { invoice } = req.body;
    const newInvoice = await CustomInvoice.create(invoice);
    res.status(201).json(newInvoice);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).json({
      message: "Something went wrong while generating invoice",
      error: error?.message || "No error message",
    });
  }
};

export const handleGetCustomInvoices = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    // const { page, pageSize } = req.query;
    // if (!page || !pageSize) {
    //   res.status(400).json({ message: "Page and pageSize are required" });
    // }
    // const invoices = await getCustomInvoices(Number(page), Number(pageSize));
    const invoices = await getCustomInvoices(user);
    console.log("fetchccccccc", invoices);
    return res.status(200).json({ invoices });
  } catch (error: any) {
    res.status(500).json({
      message: "Something went wrong while getting items",
      error: error?.message || "No error message",
    });
  }
};

export const handleGetCustomInvoiceById = async (req: Request, res: Response) => {
  try {
    const { _id } = req.params;
    const user: any = req.user;
    const invoice = await getCustomInvoiceById(_id);
    if (invoice) {
      if (user && user.role !== "admin" && invoice.client != user.client) {
        return res.status(401).json({ error: "Forbidden" });
      }
      // Add the calculation methods to the invoice object
      // Call external calculation functions
      const subtotal = calculateSubtotal(invoice);
      const total = calculateTotal(invoice);
      const itemsNo = invoice.items.reduce((total, item) => total + item.qty, 0).toFixed(2);

      const client = await Client.findOne({ name: invoice.client });
      const sender = await Client.findOne({ name: invoice.sender });
      res.status(200).json({ invoice: { ...invoice, subtotal, total, itemsNo }, client, sender });
    } else {
      res.status(404).json({ message: "No Found Invoice" });
    }


  } catch (err: any) {
    res.status(500).json({ message: "error getting invoice", error: err });
  }
};




export const handleUpdateCustomInvoice = async (req: Request, res: Response) => {
  try {
    const { _id } = req.params;
    const { invoice } = req.body;
    const updatedInvoice = await updateCustomInvoice(_id, invoice);
    res.status(200).json({ invoice: updatedInvoice });

  } catch (err: any) {
    res.status(500).json({ message: "error getting invoice", error: err });
  }
};


export const handleDeleteCustomInvoice = async (req: Request, res: Response) => {
  try {
    const { _id } = req.params;
    await deleteCustomInvoiceById(_id);
    res.status(200).json("deleted");

  } catch (err: any) {
    res.status(500).json({ message: "error getting invoice", error: err });
  }
};