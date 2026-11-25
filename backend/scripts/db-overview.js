// Prints the SkillSync database structure: collections, document counts, indexes and one
// sample document per collection. Secrets are never printed (password hashes are hidden).
// Usage: npm run db:overview
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ quiet: true });

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("MONGO_URI is missing. Add it to backend/.env (see .env.example).");
  process.exit(1);
}

await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
const db = mongoose.connection.db;
const { version } = await db.admin().serverInfo();
console.log(`Connected to MongoDB ${version} - database "${db.databaseName}"\n`);

function hideSecrets(doc) {
  if (!doc) return doc;
  const copy = JSON.parse(JSON.stringify(doc)); // ObjectId -> hex string, Date -> ISO string
  if (copy.password) copy.password = "<bcrypt hash hidden>";
  if (copy.email) copy.email = copy.email.replace(/^(.).*(@.*)$/, "$1***$2");
  if (copy.resume?.fileName) copy.resume.fileName = "<hidden>";
  if (Array.isArray(copy.skills) && copy.skills.length > 6) copy.skills = [...copy.skills.slice(0, 6), `... +${copy.skills.length - 6} more`];
  if (Array.isArray(copy.resume?.detectedSkills)) copy.resume.detectedSkills = `[${copy.resume.detectedSkills.length} skills]`;
  delete copy.__v;
  if (Array.isArray(copy.requiredSkills)) {
    const list = copy.requiredSkills.map((r) => `${r.name} (${r.level})`);
    copy.requiredSkills = list.slice(0, 4).concat(list.length > 4 ? [`... +${list.length - 4} more`] : []);
  }
  if (Array.isArray(copy.weeks)) {
    copy.weeks = copy.weeks.map((w) => ({
      week: w.week, skill: w.skill, level: w.level,
      tasks: w.tasks.map((t) => `[${t.done ? "x" : " "}] ${t.title} (_id ${t._id.slice(-6)})`),
    }));
  }
  return copy;
}

const collections = (await db.listCollections().toArray()).map((c) => c.name).sort();
for (const name of collections) {
  const col = db.collection(name);
  const count = await col.countDocuments();
  const indexes = (await col.indexes()).map((i) => `${Object.keys(i.key).join("+")}${i.unique ? " (unique)" : ""}`);
  console.log(`== ${name}: ${count} document${count === 1 ? "" : "s"}`);
  console.log(`   indexes: ${indexes.join(", ")}`);
  const sample = await col.findOne({}, { sort: { updatedAt: -1 } });
  if (sample) console.log(JSON.stringify(hideSecrets(sample), null, 2).replace(/^/gm, "   "));
  console.log();
}

await mongoose.disconnect();
