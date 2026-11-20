import dotenv from "dotenv";
dotenv.config();

const { default: app } = await import("./app.js");
const { default: connectDB } = await import("./config/db.js");

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing. Add it to backend/.env (see .env.example).");
  process.exit(1);
}

try {
  await connectDB();
} catch (err) {
  console.error("Could not connect to MongoDB:", err.message);
  process.exit(1);
}

app.listen(PORT, () => console.log(`SkillSync API running on http://localhost:${PORT}`));
