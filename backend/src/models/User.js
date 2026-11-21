import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Information about the student's uploaded resume (the PDF itself is stored on disk).
const resumeSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true }, // stored file name (not shown to users)
    originalName: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
    detectedSkills: [{ type: String }], // skills found by the AI resume analyzer
  },
  { _id: false }
);

// Student account and profile data.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Stored only as a bcrypt hash and never returned by queries unless asked for.
    password: { type: String, required: true, select: false },

    // Profile (M2)
    university: { type: String, trim: true, default: "" },
    degree: { type: String, trim: true, default: "" },
    graduationYear: { type: Number, default: null },
    interests: [{ type: String, trim: true }],
    skills: [{ type: String, trim: true }],
    resume: { type: resumeSchema, default: null },

    targetRole: { type: mongoose.Schema.Types.ObjectId, ref: "CareerRole" },
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

// A profile counts as complete when the education details are filled in.
userSchema.virtual("profileComplete").get(function () {
  return Boolean(this.university && this.degree);
});

// Remove sensitive/internal fields when a user is sent as JSON.
userSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    delete ret.id;
    if (ret.resume) delete ret.resume.fileName;
    return ret;
  },
});

export default mongoose.model("User", userSchema);
