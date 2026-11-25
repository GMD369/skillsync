import mongoose from "mongoose";

// One skill a career role needs, with the expected level.
const requiredSkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    level: { type: String, enum: ["basic", "intermediate", "advanced"], default: "basic" },
  },
  { _id: false }
);

// A career goal (e.g. "Frontend Developer") and the skills it requires.
// Collection: careerroles. Filled by `npm run seed:roles`.
const careerRoleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, default: "" },
    requiredSkills: [requiredSkillSchema],
  },
  { timestamps: true }
);

export default mongoose.model("CareerRole", careerRoleSchema);
