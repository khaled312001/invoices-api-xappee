import express, { NextFunction, Request, Response } from "express";
import passport from "passport";
import { handleCallback, handleLogout, handleSignUp } from "./auth.controller";
import { signJwt } from "../../../utils/jwt";

export const authRouter = express.Router();
authRouter.use(express.json());
authRouter.post(
  "/login/password",
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: "Internal server error" });
      }
      if (!user) {
        return res.status(401).json({ error: info.message || "Authentication failed" });
      }
      const token = signJwt(user);
      return res.status(200).json({ token, user });
    })(req, res, next);
  }
);

authRouter.post("/callback", handleCallback);
authRouter.post("/logout", handleLogout);
authRouter.post("/signup", handleSignUp);