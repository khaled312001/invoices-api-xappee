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
        client: reactivatedUser.client,
        tenant_ids: reactivatedUser.tenant_ids,
        tenant_names: reactivatedUser.tenant_names,
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

const toPlain = (doc: any) => {
  if (!doc) return doc;
  if (typeof doc.toObject === "function") return doc.toObject();
  return doc;
};

const buildJwtPayload = (u: any) => ({
  _id: u._id,
  email: u.email,
  role: u.role,
  status: u.status,
  client: u.client,
  tenant_ids: u.tenant_ids,
  tenant_names: u.tenant_names,
});

export const handleCallback = async (req: any, res: Response) => {
  const { email, image } = req.body;
  const name = req.body.name || req.body.displayName;
  const ADMIN_EMAILS = ["khaledahmedhaggagy@gmail.com", "xappeeteamegypt@gmail.com"];

  try {
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    let existingUser: any = await findUserByEmail(email);

    if (existingUser) {
      let user = toPlain(existingUser);

      if (ADMIN_EMAILS.includes(email) && user.role !== "admin") {
        const updated = await updateUserAccount({ _id: user._id, role: "admin" });
        user = toPlain(updated) || { ...user, role: "admin" };
      }

      if (user.status !== "active") {
        const reactivated = await updateUserAccount({
          _id: user._id,
          status: "active",
          reactivated: true,
        });
        user = toPlain(reactivated) || { ...user, status: "active" };
      }

      const token = signJwt(buildJwtPayload(user));
      return res.status(201).json({
        message: "User signed in successfully",
        token,
        user,
      });
    }

    const newUserData: any = { email, name, image };
    if (ADMIN_EMAILS.includes(email)) newUserData.role = "admin";

    const { token, user } = await createUserAndToken(newUserData);
    const userPlain = toPlain(user);
    return res
      .status(201)
      .json({ message: "User created successfully", token, user: userPlain });
  } catch (err: any) {
    console.error("handleCallback error:", err?.message, err?.stack);
    res.status(500).json({
      error: "Internal server error",
      detail: err?.message,
    });
  }
};
