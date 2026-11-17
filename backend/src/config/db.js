import mongoose from "mongoose";

// Connects to MongoDB. If MONGO_URI is not set yet, the API still starts
// so the rest of the setup can be tested before the database is ready.
export default async function connectDB() {
  if (!process.env.MONGO_URI) {
    console.warn("MONGO_URI not set - skipping database connection");
    return;
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
  }
}
