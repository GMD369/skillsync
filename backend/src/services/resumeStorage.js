import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

// Stores resume PDFs on the server's disk (outside the public folders).
// In development they go to backend/uploads/resumes, which is ignored by Git.
// For deployment this can be swapped for cloud storage (e.g. Cloudinary) without changing the controllers.
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "uploads/resumes");

export async function saveResume(userId, buffer) {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  // Random suffix so file names cannot be guessed.
  const fileName = `${userId}-${crypto.randomBytes(8).toString("hex")}.pdf`;
  await fs.writeFile(path.join(UPLOAD_DIR, fileName), buffer);
  return fileName;
}

export async function deleteResume(fileName) {
  if (!fileName) return;
  await fs.rm(path.join(UPLOAD_DIR, path.basename(fileName)), { force: true });
}

export function resumePath(fileName) {
  return path.join(UPLOAD_DIR, path.basename(fileName));
}
