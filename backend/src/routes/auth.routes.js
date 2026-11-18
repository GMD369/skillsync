import { Router } from "express";
import { notImplemented } from "../utils/notImplemented.js";

// Authentication module
const router = Router();
router.post("/register", notImplemented("Register"));
router.post("/login", notImplemented("Login"));

export default router;
