import express from "express";
import { handleAddClient, handleGetClients, handleDeleteClient, handleUpdateClient } from "./client.controller";


export * from "./client.controller";
export * from "./client.model";
export * from "./client.service";

export const clientRouter = express.Router();
clientRouter.post("/new", handleAddClient);
clientRouter.put("/update", handleUpdateClient);

clientRouter.use(express.json());
clientRouter.get("/", handleGetClients);

clientRouter.delete("/:name",handleDeleteClient) 


