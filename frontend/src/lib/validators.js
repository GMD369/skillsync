// Client-side validation (same rules as the backend) so students get instant feedback.
// The backend still validates everything, because client checks can be bypassed.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegisterForm({ name, email, password, confirmPassword }) {
  const errors = {};
  if (name.trim().length < 2) errors.name = "Name must be at least 2 characters";
  if (!EMAIL_REGEX.test(email.trim())) errors.email = "Please enter a valid email address";
  if (password.length < 8) errors.password = "Password must be at least 8 characters";
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
