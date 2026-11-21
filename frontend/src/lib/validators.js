// Client-side validation (same rules as the backend) so students get instant feedback.
// The backend still validates everything, because client checks can be bypassed.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// bcrypt (used on the server) only reads the first 72 bytes of a password.
const byteLength = (text) => new TextEncoder().encode(text).length;

export function validateRegisterForm({ name, email, password, confirmPassword }) {
  const errors = {};
  if (name.trim().length < 2) errors.name = "Name must be at least 2 characters";
  if (!EMAIL_REGEX.test(email.trim())) errors.email = "Please enter a valid email address";
  if (password.length < 8) errors.password = "Password must be at least 8 characters";
  else if (byteLength(password) > 72) errors.password = "Password must be at most 72 characters";
  else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))
    errors.password = "Password must contain at least one letter and one number";
  if (confirmPassword !== password) errors.confirmPassword = "Passwords do not match";
  return errors;
}

export function validateLoginForm({ email, password }) {
  const errors = {};
  if (!EMAIL_REGEX.test(email.trim())) errors.email = "Please enter a valid email address";
  if (!password) errors.password = "Password is required";
  return errors;
}

export function validateProfileForm({ name, university, degree, graduationYear }) {
  const errors = {};
  const now = new Date().getFullYear();
  if (name.trim().length < 2 || name.trim().length > 60) errors.name = "Name must be 2-60 characters";
  if (university.trim().length > 100) errors.university = "University must be at most 100 characters";
  if (degree.trim().length > 100) errors.degree = "Degree must be at most 100 characters";
  if (graduationYear !== "") {
    const year = Number(graduationYear);
    if (!Number.isInteger(year) || year < 1980 || year > now + 8)
      errors.graduationYear = `Enter a year between 1980 and ${now + 8}`;
  }
  return errors;
}

export const MAX_RESUME_BYTES = 2 * 1024 * 1024;

export function validateResumeFile(file) {
  if (!file) return "Please choose a PDF file";
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return "Only PDF files are allowed";
  if (file.size > MAX_RESUME_BYTES) return "The file is too large. Maximum size is 2 MB.";
  return null;
}
