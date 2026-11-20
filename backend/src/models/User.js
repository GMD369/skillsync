import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Student account and profile data.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Stored only as a bcrypt hash and never returned by queries unless asked for.
    password: { type: String, required: true, select: false },
    education: { type: String, default: "" },
    skills: [{ type: String, trim: true }],
    targetRole: { type: mongoose.Schema.Types.ObjectId, ref: "CareerRole" },
    resumeUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

// Hash the password automatically whenever it is set or changed.
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare a plain-text password with the stored hash.
userSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// Remove sensitive fields when a user is sent as JSON.
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("User", userSchema);
