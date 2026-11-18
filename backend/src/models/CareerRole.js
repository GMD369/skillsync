import mongoose from "mongoose";

// A career goal (e.g. "Frontend Developer") and the skills it requires.
const careerRoleSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  description: String,
  requiredSkills: [{ name: String, level: { type: String, enum: ["basic", "intermediate", "advanced"] } }],
});

export default mongoose.model("CareerRole", careerRoleSchema);
