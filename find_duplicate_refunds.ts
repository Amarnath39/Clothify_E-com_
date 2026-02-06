import mongoose from "mongoose";
const connectDB = async () => {
    if (mongoose.connections[0].readyState) return;
    await mongoose.connect("mongodb+srv://admin:admin@link-to-your-db.mongodb.net/Swaarasya"); // Wait, I need the actual URI
};
// I'll use the existing db.ts and models
