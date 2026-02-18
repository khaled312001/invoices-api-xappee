import express from "express";
import { connectMongoDB } from "./config/mongoose";
import router from "./router";
import cors from "cors";
import logger from "morgan";

import dotenv from "dotenv";
import passport from "passport";
import { passportJWTStrategyMiddleware, passportLocalStrategyMiddleware } from "./modules/user/auth/auth.middleware";
import path from "path";
dotenv.config();

export const app = express();
const PORT = process.env.PORT || 5000;

app.use(logger("dev"));

app.use(
  cors({
    credentials: true,
    origin: process.env.ORIGIN,
  })
);
// app.use(express.static('public'));
app.use(express.static('public/uploads'));
router.use(passport.initialize());

passport.use("jwt", passportJWTStrategyMiddleware);
passport.use("local", passportLocalStrategyMiddleware);

app.use(express.json());

connectMongoDB();

app.use("/api", router);

app.listen(PORT, () => {
  console.log(`Server is up and running at ${process.env.SERVER}:${PORT}`);
});
