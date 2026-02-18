import { Request, Response } from "express";
import { addClient, getClients, deleteClient, getClientWithEmail, updateClientStorageStart, updateClient, getClientWithName } from "./client.service";
import multer from 'multer';
import path from 'path';
import { getChannelsById } from "../channel/channel.service";
import fs from 'fs';

export const handleGetClients = async (req: Request, res: Response) => {
  try {
    const clients = await getClients();
    return res.status(200).json({ clients });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: " Failed to get clients",
      error: err,
      clients: [],
    });
  }
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'public/uploads');
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    },
  }),
});


export const handleUpdateClient = async (req: Request, res: Response) => {
  try {
    // const { client } = req.body;
    // if (!client) {
    //   return res.status(400).json({ message: "client is required" });
    // }
    // const updatedClient = await updateClient(client);
    // return res.status(200).json({ client: updatedClient });

    upload.single('image')(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ error: 'File upload failed' });
      }
      const client= req.body;
      const existingClient = await getClientWithName(client.name); // Implement this function
      const imageUrl = req.file ? `/${req.file.filename}` : null;

      if (imageUrl !=null && existingClient) {
        const oldImageUrl = existingClient.imageUrl; // Get the old image URL
        if (oldImageUrl) {
          const oldImagePath = path.join(process.cwd(), 'public/uploads', oldImageUrl); // Adjust the path as needed
          fs.unlink(oldImagePath, (unlinkErr) => {
            if (unlinkErr) {
              console.error('Failed to delete old image:', unlinkErr);
              // Handle the error (optional, continue with the update anyway)
            }
          });
        }
      }
   
      console.log("client",client)
    
      const updatedClient = await updateClient({
        ...client,
        imageUrl
      });
      res.status(200).json({ updatedClient });
      
    });

  } catch (error: any) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong while updating client",
      error: error?.message || "No error message",
    });
  }

};

export const handleAddClient = async (req: Request, res: Response) => {
  try {

    // const newClient = await addClient({
    //   ...client,
    //   channelRefs: channels.map((c) => c._id),
    // });
    // res.status(201).json({ newClient });
    upload.single('image')(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ error: 'File upload failed' });
      }
    
      const client= req.body;
      const channelIds = client.channel_ids ? JSON.parse(client.channel_ids).map((id: string | number) => Number(id)) : [];
      const channels = await getChannelsById(channelIds);

      const imageUrl = req.file ? `/${req.file.filename}` : null;
      const newClient = await addClient({
        ...client,
        imageUrl, // Save the image URL
        channelRefs: channels.map((c) => c._id),
      });
      res.status(201).json({ newClient });
      
    });
  } catch (err: any) {
    console.error(err.message);
    return res.status(500).json({
      message: "Failed to add new client",
      error: err,
    });
  }
};

export const handleDeleteClient = async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const client = await deleteClient(name);
    res.status(201).json({ client });
  } catch (err: any) {
    return res.status(500).json({
      message: "Failed to delete client",
      error: err,
    });
  }
};

