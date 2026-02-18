const mongoose = require("mongoose");
require("dotenv").config();

export const connectMongoDB = async () => {
  let mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.error("MONGODB_URI is not defined in environment variables");
    return;
  }

  // Auto-trim to prevent "Invalid scheme" errors from hidden spaces
  mongoURI = mongoURI.trim();

  // Log masked URI for debugging scheme issues
  console.log(`Connecting to MongoDB with scheme: ${mongoURI.substring(0, 15)}...`);

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    console.log("Successfully connected to MongoDB");
    return mongoose.connection;
  } catch (e: any) {
    console.error("Failed to connect to MongoDB:", e.message);
    throw e; // Re-throw so the health-check can capture it
  }
};

// Logic to handle successful connection
mongoose.connection.on("connected", () => {
  console.log("Mongoose connection is open");
});

// Logic to handle connection errors after initial connection
mongoose.connection.on("error", (error: any) => {
  console.error(`Mongoose connection error has occurred: ${error}`);
});

// Logic to handle MongoDB disconnection
mongoose.connection.on("disconnected", () => {
  console.log("Mongoose connection is disconnected");
});
