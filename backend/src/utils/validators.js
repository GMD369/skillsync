// Input validation for authentication.
// Each function returns an object of { field: "error message" }; empty means valid.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
