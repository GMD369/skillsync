// One-time migration: removes fields left over from the first User schema (Day 1),
// which were replaced by university/degree (education) and the resume sub-document (resumeUrl).
// Mongoose ignores unknown fields, so they were harmless but made the stored data confusing.
// Usage: node scripts/remove-old-fields.js
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ quiet: true });
if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is missing. Add it to backend/.env (see .env.example).");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
const users = mongoose.connection.db.collection("users");
const result = await users.updateMany(
  { $or: [{ education: { $exists: true } }, { resumeUrl: { $exists: true } }] },
  { $unset: { education: "", resumeUrl: "" } }
);
console.log(`Removed old fields from ${result.modifiedCount} user document(s).`);
await mongoose.disconnect();
