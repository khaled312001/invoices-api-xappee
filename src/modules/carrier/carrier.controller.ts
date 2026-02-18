import { Request, Response } from "express";
import { getCarriers } from "./carrier.service";

export const handleGetCarriers = async (req: Request, res: Response) => {
  try {
    const carriers = await getCarriers();
    res.status(200).json({ carriers });
  } catch (error: any) {
    res.status(500).json({
      message: "Something went wrong while fetching carriers.",
      error: error?.message || "No error message",
    });
  }
};
