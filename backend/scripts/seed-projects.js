// Inserts or updates the portfolio project ideas used for recommendations (M7).
// Usage: npm run seed:projects
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ quiet: true });
const { default: Project } = await import("../src/models/Project.js");
const { default: projects } = await import("../src/data/projects.js");

if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing from backend/.env");
await mongoose.connect(process.env.MONGO_URI);
for (const project of projects) {
  await Project.findOneAndUpdate({ title: project.title }, project, { upsert: true, runValidators: true });
}
console.log(`Seeded ${projects.length} project ideas.`);
await mongoose.disconnect();
