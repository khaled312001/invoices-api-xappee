import express from "express";
import { handleGetCarriers } from "./carrier.controller";

export * from "./carrier.controller";
export * from "./carrier.model";
export * from "./carrier.service";

export const carrierRouter = express.Router();
carrierRouter.use(express.json());
carrierRouter.get("/", handleGetCarriers);
