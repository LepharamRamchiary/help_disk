import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import "dotenv/config";

const getMongoUri = () => {
  const baseUri = process.env.MONGODB_URI;
  return baseUri.endsWith("/") ? `${baseUri}${DB_NAME}` : `${baseUri}/${DB_NAME}`;
};

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(getMongoUri());
    console.log(
      `MongoDB connected successfully: ${connectionInstance.connection.host}/${DB_NAME}`,
    );
    return connectionInstance;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message || error);
    throw error;
  }
};

export default connectDB;
