const mongoose = require("mongoose");
require("dotenv").config();

const mongoURI = process.env.MONGODB_URI;

// Function to connect to the database
export const connectMongoDB = () => {
  mongoose
    .connect(mongoURI, {})
    .then(() => console.log("Successfully connected to MongoDB"))
    .catch((e: any) => {
      console.error(
        "Failed to connect to MongoDB. Retrying in 5 seconds...",
        e
      );
      setTimeout(connectMongoDB, 5000);
    });
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
