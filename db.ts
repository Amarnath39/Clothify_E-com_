import mongoose from "mongoose";
import "./src/model/Product";
import "./src/model/Category";
import "./src/model/Order";
import "./src/model/Counter";

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log("Using existing DB connection");
    return;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn("⚠️ MONGO_URI is not defined. Skipping DB connection (expected during build/static optimization).");
    return;
  }

  try {
    const db = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });

    isConnected = db.connections[0].readyState === 1;
    console.log("✅ DB Connected");
  } catch (e) {
    console.error("❌ Error to connect DB", e);
    // Only throw in runtime, not during build if possible, 
    // but throwing is usually safer for real runtime errors.
    throw e;
  }
};
