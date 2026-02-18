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
router.use("/users", verifyUser, verifyAdmin, userRouter);
router.use("/channels", verifyUser, channelRouter);
router.use("/carriers", verifyUser, carrierRouter);
router.use("/items", verifyUser, ItemRouter);
router.use("/orders", verifyUser, verifyAdmin, orderRouter);
router.use("/invoices", verifyUser, invoiceRouter);
router.use("/clients", verifyUser, verifyAdmin, clientRouter);

router.get("/health-check", async (req, res) => {
    try {
        const mongoose = require("mongoose");
        const dbStatus = mongoose.connection.readyState;
        const statusMap: Record<number, string> = {
            0: "disconnected",
            1: "connected",
            2: "connecting",
            3: "disconnecting",
        };

        res.status(200).json({
            status: "success",
            message: "Server is up and running",
            database: {
                status: statusMap[dbStatus] || "unknown",
                readyState: dbStatus,
            },
            env: {
                NODE_ENV: process.env.NODE_ENV,
                SERVER: process.env.SERVER,
                ORIGIN: process.env.ORIGIN,
                MONGODB_URI: process.env.MONGODB_URI ? "LOADED (MASKED)" : "NOT LOADED",
            },
            timestamp: new Date().toISOString(),
        });
    } catch (err: any) {
        res.status(500).json({
            status: "error",
            message: err.message,
        });
    }
});

export default router;
