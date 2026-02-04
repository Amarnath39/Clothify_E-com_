import mongoose from "mongoose";

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log("Using existing DB connection");
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGO_URI as string, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });

    isConnected = db.connections[0].readyState === 1;
    console.log("✅ DB Connected");
  } catch (e) {
    console.error("❌ Error to connect DB", e);
    throw e;
  }
};
