import mongoose from "mongoose";

// Student account and profile data.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // stored as a bcrypt hash
    education: { type: String, default: "" },
    skills: [{ type: String, trim: true }],
    targetRole: { type: mongoose.Schema.Types.ObjectId, ref: "CareerRole" },
    resumeUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
