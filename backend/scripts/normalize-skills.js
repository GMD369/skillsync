// One-time maintenance script: converts every student's saved skills to standard names
// and removes duplicates (e.g. "Nextjs" + "Next.js" -> "Next.js").
// Needs MongoDB and the AI service to be running.
//
// Usage:  cd backend && node scripts/normalize-skills.js
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ quiet: true });
const { default: User } = await import("../src/models/User.js");
const { normalizeSkills } = await import("../src/services/aiClient.js");
const { cleanList } = await import("../src/utils/validators.js");

await mongoose.connect(process.env.MONGO_URI);
let changed = 0;
for (const user of await User.find({ "skills.0": { $exists: true } })) {
  const before = [...user.skills];
  const after = cleanList(await normalizeSkills(cleanList(before)));
  if (after.join("|") !== before.join("|")) {
    user.skills = after;
    await user.save();
    changed += 1;
    console.log(`${user.email}: ${before.length} -> ${after.length} skills`);
  }
}
console.log(`Done. ${changed} user(s) updated.`);
await mongoose.disconnect();
