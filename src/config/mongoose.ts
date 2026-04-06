const mongoose = require("mongoose");
require("dotenv").config();

// Global connection cache for serverless environments
let cached: { conn: any; promise: Promise<any> | null } = (global as any).__mongoose_cache;
if (!cached) {
  cached = (global as any).__mongoose_cache = { conn: null, promise: null };
}

export const connectMongoDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    let mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }
    mongoURI = mongoURI.trim();

    console.log(`Connecting to MongoDB: ${mongoURI.substring(0, 20)}...`);

    cached.promise = mongoose
      .connect(mongoURI, {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 60000,
        bufferCommands: false,
      })
      .then((m: any) => {
        console.log("MongoDB connected successfully");
        return m.connection;
      })
      .catch((err: any) => {
        console.error("MongoDB connection failed:", err.message);
        cached.promise = null; // reset so next call retries
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected — resetting cache");
  cached.conn = null;
  cached.promise = null;
});
