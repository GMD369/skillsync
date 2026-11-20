import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { validateRegister, validateLogin } from "../utils/validators.js";

// POST /api/auth/register  (FR-01)
export async function register(req, res, next) {
  try {
    const errors = validateRegister(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({ message: "Please fix the highlighted fields", errors });
    }

    const name = req.body.name.trim();
    const email = req.body.email.trim().toLowerCase();

    if (await User.exists({ email })) {
      return res.status(409).json({
        message: "An account with this email already exists",
        errors: { email: "This email is already registered" },
      });
    }

    // The password is hashed by the User model before saving.
    const user = await User.create({ name, email, password: req.body.password });
    res.status(201).json({ message: "Account created", token: generateToken(user._id), user });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login  (FR-02)
export async function login(req, res, next) {
  try {
    const errors = validateLogin(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({ message: "Please fix the highlighted fields", errors });
    }

    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ email }).select("+password");

    // Same message for unknown email and wrong password, so attackers
    // cannot find out which emails are registered.
    if (!user || !(await user.comparePassword(req.body.password))) {
      return res.status(401).json({ message: "Incorrect email or password" });
    }

    res.json({ message: "Logged in", token: generateToken(user._id), user });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me  (FR-03) - returns the logged-in user
export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ message: "Account no longer exists" });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
