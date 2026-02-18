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

        // If disconnected, try to connect again (useful for serverless)
        let connectionError = null;
        const { connectMongoDB } = require("./config/mongoose");

        if (mongoose.connection.readyState === 0) {
            try {
                await connectMongoDB();
            } catch (err: any) {
                connectionError = err.message;
            }
        }

        const dbStatus = mongoose.connection.readyState;
        const statusMap: Record<number, string> = {
            0: "disconnected",
            1: "connected",
            2: "connecting",
            3: "disconnecting",
        };

        res.status(200).json({
            status: dbStatus === 1 ? "success" : "warning",
            message: dbStatus === 1 ? "Server is up and running" : `Connection Status: ${statusMap[dbStatus]}`,
            database: {
                status: statusMap[dbStatus] || "unknown",
                readyState: dbStatus,
                host: mongoose.connection.host,
                error: connectionError || (dbStatus === 0 ? "Not connected yet" : null),
                uri_check: process.env.MONGODB_URI ? `${process.env.MONGODB_URI.substring(0, 15)}...` : "Empty"
            },
            env_debug: {
                NODE_ENV: process.env.NODE_ENV,
                VERCEL: process.env.VERCEL,
                HAS_MONGODB_URI: !!process.env.MONGODB_URI,
                SERVER: process.env.SERVER,
                ORIGIN: process.env.ORIGIN,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (err: any) {
        res.status(500).json({
            status: "error",
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

router.get("/list-collections", async (req, res) => {
    const { MongoClient } = require('mongodb');
    if (req.query.secret !== "migrate123") {
        return res.status(403).json({ error: "Unauthorized" });
    }

    const sourceUri = "mongodb://xappeesoftware:LMph7vvVk1gvgSMU@ac-qd91bec-shard-00-00.qd91bec.mongodb.net:27017,ac-qd91bec-shard-00-01.qd91bec.mongodb.net:27017,ac-qd91bec-shard-00-02.qd91bec.mongodb.net:27017/?ssl=true&replicaSet=atlas-qd91bec-shard-0&authSource=admin&retryWrites=true&w=majority";
    const client = new MongoClient(sourceUri);

    try {
        await client.connect();
        const db = client.db("test");
        const collections = await db.listCollections().toArray();
        res.status(200).json({ collections: collections.map((c: any) => c.name) });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    } finally {
        await client.close();
    }
});

router.get("/migrate-data", async (req, res) => {
    const { MongoClient } = require('mongodb');
    const collectionName = req.query.collection as string;

    if (req.query.secret !== "migrate123") {
        return res.status(403).json({ error: "Unauthorized. Use ?secret=migrate123" });
    }

    if (!collectionName) {
        return res.status(400).json({ error: "Please provide a collection name via ?collection=NAME" });
    }

    // Source Database (Old) - Using Standard Format
    const sourceUri = "mongodb://xappeesoftware:LMph7vvVk1gvgSMU@ac-qd91bec-shard-00-00.qd91bec.mongodb.net:27017,ac-qd91bec-shard-00-01.qd91bec.mongodb.net:27017,ac-qd91bec-shard-00-02.qd91bec.mongodb.net:27017/?ssl=true&replicaSet=atlas-qd91bec-shard-0&authSource=admin&retryWrites=true&w=majority";
    const destUri = process.env.MONGODB_URI;

    if (!destUri) {
        return res.status(500).json({ error: "Destination MONGODB_URI not set" });
    }

    const sourceClient = new MongoClient(sourceUri);
    const destClient = new MongoClient(destUri);

    try {
        await sourceClient.connect();
        await destClient.connect();

        const sourceDb = sourceClient.db("test");
        const destDb = destClient.db("test");

        const data = await sourceDb.collection(collectionName).find({}).toArray();

        if (data.length > 0) {
            await destDb.collection(collectionName).deleteMany({});
            await destDb.collection(collectionName).insertMany(data);
            res.status(200).json({
                status: "success",
                collection: collectionName,
                count: data.length
            });
        } else {
            res.status(200).json({
                status: "skipped",
                collection: collectionName,
                count: 0,
                message: "Collection is empty"
            });
        }
    } catch (err: any) {
        res.status(500).json({
            status: "error",
            message: err.message
        });
    } finally {
        await sourceClient.close();
        await destClient.close();
    }
});

export default router;
