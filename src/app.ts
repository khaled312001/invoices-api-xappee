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

// Connect to MongoDB (Fire and forget, but catch potential errors)
connectMongoDB().catch(err => {
  console.error("Initial MongoDB connection failed:", err.message);
});

app.use("/api", router);

// Only listen if not running in Vercel (Vercel handles the server)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is up and running at ${process.env.SERVER || 'http://localhost'}:${PORT}`);
  });
}

// Export the app for Vercel
export default app;
