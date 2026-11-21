// Input validation. Each function returns an object of { field: "error message" }; empty means valid.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// bcrypt only uses the first 72 bytes of a password, so longer passwords are rejected
// (otherwise two different long passwords with the same start would both work).
export const PASSWORD_MAX_BYTES = 72;

export function validateRegister({ name, email, password } = {}) {
  const errors = {};
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters";
  } else if (name.trim().length > 60) {
    errors.name = "Name must be at most 60 characters";
  }
  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    errors.email = "Please enter a valid email address";
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  } else if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) {
    errors.password = "Password must be at most 72 characters";
  } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.password = "Password must contain at least one letter and one number";
  }
  return errors;
}

export function validateLogin({ email, password } = {}) {
  const errors = {};
  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    errors.email = "Please enter a valid email address";
  }
  if (!password || typeof password !== "string") {
    errors.password = "Password is required";
  }
  return errors;
}

// ---------------------------------------------------------------- Profile (M2)

export const PROFILE_LIMITS = { maxSkills: 50, maxSkillLength: 40, maxInterests: 10, maxInterestLength: 40 };

// Trims, removes empty values and duplicates (case-insensitive), keeps the first spelling.
export function cleanList(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const value = String(item).trim().replace(/\s+/g, " ");
    const key = value.toLowerCase();
    if (value && !seen.has(key)) {
      seen.add(key);
      out.push(value);
    }
  }
  return out;
}

function checkList(value, field, label, max, maxLength, errors) {
  if (value === undefined) return;
  if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) {
    errors[field] = `${label} must be a list of text values`;
  } else if (cleanList(value).length > max) {
    errors[field] = `You can add at most ${max} ${label.toLowerCase()}`;
  } else if (value.some((v) => v.trim().length > maxLength)) {
    errors[field] = `Each item must be at most ${maxLength} characters`;
  }
}

// Validates a profile update. Only fields that are present are checked (partial updates).
export function validateProfile(body = {}) {
  const errors = {};
  const { name, university, degree, graduationYear, skills, interests } = body;

  if (name !== undefined && (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 60)) {
    errors.name = "Name must be 2-60 characters";
  }
  for (const [field, value, label] of [["university", university, "University"], ["degree", degree, "Degree"]]) {
    if (value !== undefined && (typeof value !== "string" || value.trim().length > 100)) {
      errors[field] = `${label} must be at most 100 characters`;
    }
  }
  if (graduationYear !== undefined && graduationYear !== null && graduationYear !== "") {
    const year = Number(graduationYear);
    const now = new Date().getFullYear();
    if (!Number.isInteger(year) || year < 1980 || year > now + 8) {
      errors.graduationYear = `Graduation year must be between 1980 and ${now + 8}`;
    }
  }
  checkList(skills, "skills", "Skills", PROFILE_LIMITS.maxSkills, PROFILE_LIMITS.maxSkillLength, errors);
  checkList(interests, "interests", "Interests", PROFILE_LIMITS.maxInterests, PROFILE_LIMITS.maxInterestLength, errors);
  return errors;
}
