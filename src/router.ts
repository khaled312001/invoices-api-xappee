import { carrierRouter } from "./modules/carrier/index";
import express from "express";
import { channelRouter } from "./modules/channel";
import { ItemRouter } from "./modules/item";
import { orderRouter } from "./modules/order";
import { invoiceRouter } from "./modules/invoices";
import { clientRouter } from "./modules/client";
import { authRouter } from "./modules/user/auth/auth.router";
import { userRouter } from "./modules/user";
import { verifyAdmin, verifyUser } from "./middleware/authentication.middleware";

const router = express.Router();

router.use("/auth", authRouter);
router.use("/users", verifyUser,verifyAdmin, userRouter);
router.use("/channels", verifyUser, channelRouter);
router.use("/carriers", verifyUser, carrierRouter);
router.use("/items", verifyUser, ItemRouter);
router.use("/orders", verifyUser,verifyAdmin, orderRouter);
router.use("/invoices", verifyUser, invoiceRouter);
router.use("/clients", verifyUser,verifyAdmin, clientRouter);

// router.get("/migrate/items", async (req, res) => {
//   try {
//     await migrateUpdateItems();
//     res.status(200).json({ message: "Database migration successful" });
//   } catch (err: any) {
//     console.error(err);
//   }
//   res.status(200).json({ message: "Server is up and running" });
// });

export default router;
