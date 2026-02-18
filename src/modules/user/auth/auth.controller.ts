import { NextFunction, Request, Response } from "express";
import { generateSalt, hashPassword } from "./utils";
import mongoose from "mongoose";
import { signJwt } from "../../../utils/jwt";
import { createUserAndToken } from "./auth.helper";
import { findUserByEmail, updateUserAccount } from "../user.service";

export const handleLogout = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  // Check if the user is not signed in
  if (!req.user) {
    return res.status(400).json({ error: "User already signed out." });
  }
  req.user = undefined;
  return res.status(200).json({ message: "User signed out successfully." });
};

export const handleSignUp = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const salt = generateSalt();
    const { err, hash } = await hashPassword(req.body.password, salt);
    if (err || !hash) return next(err);

    const existingUser = await findUserByEmail(req.body.email);

    if (existingUser) {
      if (existingUser.status === "active") {
        return res.status(400).json({ error: "User already exists" });
      }
      const reactivatedUser = await updateUserAccount({
        _id: existingUser._id,
        name: req.body.name,
        email: req.body.email,
        image: req.body.image,
        hash,
        salt,
        status: "active",
      });
      const token = signJwt({
        _id: reactivatedUser._id,
        email: reactivatedUser.email,
        role: reactivatedUser.role,
        status: reactivatedUser.status,
      });
      return res.status(201).json({
        message: "User created successfully",
        token,
        user: reactivatedUser,
      });
    }

    const { token, user } = await createUserAndToken({
      _id: new mongoose.Types.ObjectId(),
      reactivated: true,
      name: req.body.name,
      email: req.body.email,
      image: req.body.image,
      strategy: "local",
      hash,
      salt,
    });

    return res
      .status(201)
      .json({ message: "User created successfully", token, user });
  } catch (error: any) {
    switch (error.code) {
      case 11000:
        return res.status(409).json({
          error: "User already exists with this email.",
        });
      default:
        return res.status(error.status || 500).json({ error: error.message });
    }
  }
};

export const handleCallback = async (req: any, res: Response) => {
  const { email, name, image } = req.body;

  try {
    let existingUser = await findUserByEmail(email);
    if (existingUser) {
      // If existing user account is active sign him in
      if (existingUser.status === "active") {
        const token = signJwt(existingUser);
        return res.status(201).json({
          message: "User signed in successfully",
          token,
          user: existingUser,
        });
      }

      // If it's deleted reactivate the account & sign him in
      const reactivatedUser = await updateUserAccount({
        ...existingUser,
        _id: new mongoose.Types.ObjectId(),
        reactivated: true,
        status: "active",
      });

      const token = signJwt(reactivatedUser);
      return res.status(201).json({
        message: "User created successfully",
        token,
        user: reactivatedUser,
      });
    }

    // if the user doesn't exist sign him up
    const { token, user } = await createUserAndToken({
      email,
      name,
      image,
    });

    return res
      .status(201)
      .json({ message: "User created successfully", token, user });
  } catch (err) {
    console.error(err); 
    res.status(500).json({ error: "Internal server error" });
  }
};
