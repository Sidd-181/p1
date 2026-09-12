import { Router } from "express";
import { z } from "zod";
import { requireSession } from "../middleware/requireSession.js";
import {
  getSessionUser,
  loginUser,
  registerUser,
} from "../services/auth.service.js";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  timezone: z.string().trim().min(1).max(64).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(72),
});

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please enter a valid name, email, and password" });
    return;
  }

  try {
    const result = await registerUser(parsed.data);
    res.status(201).json(result);
  } catch (error) {
    console.error("register failed", error);
    res.status(error.status ?? 500).json({
      error: error.message ?? "Could not create account",
    });
  }
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please enter a valid email and password" });
    return;
  }

  try {
    const result = await loginUser(parsed.data);
    res.json(result);
  } catch (error) {
    console.error("login failed", error);
    res.status(error.status ?? 500).json({
      error: error.message ?? "Could not sign in",
    });
  }
});

authRouter.get("/me", requireSession, async (req, res) => {
  try {
    const user = await getSessionUser(req.auth.userId);
    res.json({ user });
  } catch (error) {
    res.status(error.status ?? 500).json({
      error: error.message ?? "Could not load session",
    });
  }
});
