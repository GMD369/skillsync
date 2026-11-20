import mongoose from "mongoose";

// Connects to MongoDB using MONGO_URI from .env
// - Local development: mongodb://127.0.0.1:27017/skillsync
// - Deployment:       a MongoDB Atlas connection string
export default async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is missing. Add it to backend/.env (see .env.example).");
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log(`MongoDB connected (${mongoose.connection.name})`);
}
