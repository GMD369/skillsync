import mongoose from "mongoose";

// Portfolio project ideas (M7, FR-13). Each idea lists the skills a student practises by building it.
const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true, trim: true, maxlength: 80 },
    description: { type: String, required: true, trim: true },
    level: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    skills: {
      type: [{ type: String, trim: true }],
      validate: { validator: (list) => list.length > 0, message: "A project needs at least one skill" },
    },
    features: [{ type: String, trim: true }], // what the finished project should include
    estimatedHours: { type: Number, min: 1, max: 200 },
  },
  { timestamps: true }
);

projectSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Project", projectSchema);
