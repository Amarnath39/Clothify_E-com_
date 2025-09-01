import mongoose from "mongoose";
export const connectDB = () => {
  mongoose
    .connect(process.env.MONGO_URI as string, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    })
    .then(() => console.log("DB Connected"))
    .catch((e) => console.log("Error to connect DB", e));
};
