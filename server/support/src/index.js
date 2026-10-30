import mongoose from "mongoose";
import "dotenv/config";
import connectDB from "./db/index.js";
import { app } from "./app.js";

const PORT = Number(process.env.PORT);

if (!Number.isInteger(PORT) || PORT <= 0) {
  throw new Error(`Invalid PORT value: ${process.env.PORT}`);
}

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`Support server is running on http://localhost:${PORT}`);
    });

    const shutdown = (signal) => {
      console.log(`\nReceived ${signal}. Gracefully shutting down support server...`);

      server.close(async () => {
        try {
          await mongoose.connection.close();
          console.log("MongoDB connection closed.");
          process.exit(0);
        } catch (error) {
          console.error("Error while closing MongoDB connection:", error.message || error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        console.error("Server shutdown timed out. Force exiting...");
        process.exit(1);
      }, 5000);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start support server:", error.message || error);
    process.exit(1);
  }
};

startServer();
