import jwt from "jsonwebtoken";

// Creates a signed JWT containing the user's id. Expires after 7 days (NFR-02).
export function generateToken(userId) {
  return jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}
