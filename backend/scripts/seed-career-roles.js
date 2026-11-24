// Inserts or updates the five approved SkillSync career roles.
// Usage: npm run seed:roles
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ quiet: true });
const { default: CareerRole } = await import("../src/models/CareerRole.js");

const roles = [
  {
    title: "Frontend Developer",
    description: "Build accessible, responsive web interfaces with modern JavaScript and React.",
    requiredSkills: [
      ["HTML", "intermediate"], ["CSS", "intermediate"], ["JavaScript", "intermediate"],
      ["React", "intermediate"], ["Git", "basic"], ["Responsive Design", "intermediate"],
      ["Testing", "basic"], ["REST APIs", "basic"],
    ],
  },
  {
    title: "Backend Developer",
    description: "Create secure APIs, business logic and reliable database-backed services.",
    requiredSkills: [
      ["JavaScript", "intermediate"], ["Node.js", "intermediate"], ["Express.js", "intermediate"],
      ["REST APIs", "intermediate"], ["MongoDB", "intermediate"], ["SQL", "basic"],
      ["Git", "basic"], ["Testing", "intermediate"], ["JWT", "basic"],
    ],
  },
  {
    title: "Full-Stack Developer",
    description: "Develop complete web products across the browser, API and database layers.",
    requiredSkills: [
      ["HTML", "intermediate"], ["CSS", "intermediate"], ["JavaScript", "intermediate"],
      ["React", "intermediate"], ["Node.js", "intermediate"], ["Express.js", "intermediate"],
      ["MongoDB", "intermediate"], ["REST APIs", "intermediate"], ["Git", "basic"],
      ["Testing", "basic"],
    ],
  },
  {
    title: "Data Analyst",
    description: "Turn raw data into clear insights, dashboards and evidence-based recommendations.",
    requiredSkills: [
      ["Excel", "intermediate"], ["SQL", "intermediate"], ["Python", "basic"],
      ["Pandas", "intermediate"], ["Statistics", "intermediate"], ["Data Analysis", "intermediate"],
      ["Data Visualization", "intermediate"], ["Power BI", "basic"], ["Communication", "basic"],
    ],
  },
  {
    title: "AI/ML Beginner",
    description: "Build a foundation in Python, data preparation and introductory machine learning.",
    requiredSkills: [
      ["Python", "intermediate"], ["NumPy", "basic"], ["Pandas", "intermediate"],
      ["Statistics", "basic"], ["Machine Learning", "basic"], ["Scikit-learn", "basic"],
      ["Data Visualization", "basic"], ["Git", "basic"], ["Problem Solving", "intermediate"],
    ],
  },
].map((role) => ({
  ...role,
  requiredSkills: role.requiredSkills.map(([name, level]) => ({ name, level })),
}));

if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing from backend/.env");
await mongoose.connect(process.env.MONGO_URI);
for (const role of roles) {
  await CareerRole.findOneAndUpdate({ title: role.title }, role, { upsert: true });
}
console.log(`Seeded ${roles.length} career roles.`);
await mongoose.disconnect();
