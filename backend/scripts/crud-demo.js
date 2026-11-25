// Demonstrates the four basic database operations (Create, Read, Update, Delete) with the
// real SkillSync models. It uses a temporary demo student and removes everything it creates.
// Usage: npm run db:crud-demo
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ quiet: true });
const { default: User } = await import("../src/models/User.js");
const { default: CareerRole } = await import("../src/models/CareerRole.js");
const { default: Roadmap } = await import("../src/models/Roadmap.js");

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is missing. Add it to backend/.env (see .env.example).");
  process.exit(1);
}
await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
console.log(`Connected to database "${mongoose.connection.name}"`);

const email = `crud-demo-${Date.now()}@example.com`;
const step = (title) => console.log(`\n--- ${title} ---`);

try {
  // CREATE: insert a new student (the password is hashed by the model before saving)
  step("CREATE  User.create()");
  const created = await User.create({ name: "CRUD Demo Student", email, password: "demo-password-123", skills: ["HTML", "CSS"] });
  const stored = await User.findById(created._id).select("+password").lean();
  console.log(`Inserted user ${created._id} (${created.name})`);
  console.log(`Password stored as a bcrypt hash: ${stored.password.slice(0, 7)}...`);

  // CREATE with a relationship: a roadmap that references the user and a career role
  const role = await CareerRole.findOne({ title: "Frontend Developer" });
  if (!role) throw new Error("Run `npm run seed:roles` first");
  const roadmap = await Roadmap.create({
    user: created._id,
    role: role._id,
    weeks: [{ week: 1, skill: "JavaScript", level: "intermediate", tasks: [{ title: "Learn the core concepts of JavaScript" }] }],
  });
  console.log(`Inserted roadmap ${roadmap._id} -> user ${roadmap.user}, role "${role.title}"`);

  // READ: find documents and follow the references with populate()
  step("READ  User.findOne() / Roadmap.findOne().populate()");
  const found = await User.findOne({ email }).lean();
  console.log(`Found user: ${found.name}, skills = [${found.skills.join(", ")}]`);
  const withRefs = await Roadmap.findOne({ user: created._id }).populate("user", "name").populate("role", "title");
  console.log(`Roadmap belongs to "${withRefs.user.name}" for role "${withRefs.role.title}"`);

  // UPDATE: change fields of existing documents
  step("UPDATE  User.updateOne() / task.done = true");
  const upd = await User.updateOne({ _id: created._id }, { $set: { university: "Demo University", targetRole: role._id }, $push: { skills: "JavaScript" } });
  console.log(`users matched: ${upd.matchedCount}, modified: ${upd.modifiedCount}`);
  withRefs.weeks[0].tasks[0].done = true;
  withRefs.weeks[0].tasks[0].doneAt = new Date();
  await withRefs.save();
  console.log(`Roadmap progress now: ${JSON.stringify(withRefs.progress())}`);
  const after = await User.findById(created._id).lean();
  console.log(`User now: university = "${after.university}", skills = [${after.skills.join(", ")}]`);

  // DELETE: remove the roadmap and the user (the same order the app uses when an account is deleted)
  step("DELETE  Roadmap.deleteMany() / User.deleteOne()");
  const delMaps = await Roadmap.deleteMany({ user: created._id });
  const delUser = await User.deleteOne({ _id: created._id });
  console.log(`roadmaps deleted: ${delMaps.deletedCount}, users deleted: ${delUser.deletedCount}`);
  console.log(`User still exists? ${Boolean(await User.exists({ email }))}`);
} finally {
  // Safety net: never leave demo data behind, even if a step failed.
  const leftover = await User.findOne({ email });
  if (leftover) {
    await Roadmap.deleteMany({ user: leftover._id });
    await leftover.deleteOne();
  }
  await mongoose.disconnect();
}
console.log("\nAll four operations completed. Demo data removed.");
