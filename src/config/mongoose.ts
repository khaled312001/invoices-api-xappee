const mongoose = require("mongoose");
require("dotenv").config();

export const connectMongoDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.error("MONGODB_URI is not defined in environment variables");
    return;
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Successfully connected to MongoDB");
    return mongoose.connection;
  } catch (e: any) {
    console.error("Failed to connect to MongoDB:", e.message);
    throw e; // Rethrow to allow health-check to capture the error
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
