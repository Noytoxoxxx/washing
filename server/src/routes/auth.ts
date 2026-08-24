import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { COOKIE_NAME, NODE_ENV } from "../config";
import { asyncHandler, ApiError } from "../middleware/error";
import { attachUser, requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives. Réessayez dans quelques minutes." },
});

function setSessionCookie(res: any, token: string, remember = true) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "lax",
    // "Remember me" unchecked -> session cookie (cleared when the browser closes) instead of 30 days.
    ...(remember ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}),
    path: "/",
  });
}

const registerSchema = z.object({
  email: z.string().email("Adresse email invalide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  firstName: z.string().min(1, "Le prénom est requis."),
  lastName: z.string().min(1, "Le nom est requis."),
  phone: z.string().optional(),
});

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) throw new ApiError(409, "Un compte existe déjà avec cet email.");

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: "CLIENT",
      },
    });

    const token = signToken({ userId: user.id, role: "CLIENT" });
    setSessionCookie(res, token);
    res.status(201).json({ user: publicUser(user) });
  })
);

const loginSchema = z.object({
  email: z.string().email("Adresse email invalide."),
  password: z.string().min(1, "Mot de passe requis."),
  remember: z.boolean().optional(),
});

router.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (!user) throw new ApiError(401, "Email ou mot de passe incorrect.");
    if (user.status !== "active") throw new ApiError(403, "Ce compte est suspendu.");

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) throw new ApiError(401, "Email ou mot de passe incorrect.");

    const token = signToken({ userId: user.id, role: user.role as any });
    setSessionCookie(res, token, data.remember ?? true);
    res.json({ user: publicUser(user) });
  })
);

router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
});

router.get(
  "/me",
  attachUser,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.user) return res.json({ user: null });
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { professionalProfile: { select: { id: true, slug: true, status: true } } },
    });
    if (!user) return res.json({ user: null });
    res.json({ user: publicUser(user), professionalProfile: user.professionalProfile });
  })
);

const forgotSchema = z.object({ email: z.string().email() });

router.post(
  "/forgot-password",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const data = forgotSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    // Always respond the same way to avoid leaking which emails are registered.
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      await prisma.passwordReset.create({
        data: { userId: user.id, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
      });
      // Email delivery is out of scope for V1 (see spec §91) — token is logged server-side so the
      // reset flow is fully testable end-to-end without a mail provider.
      console.log(`[password-reset] ${user.email} -> token=${token}`);
    }
    res.json({ ok: true, message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé." });
  })
);

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
});

router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const data = resetSchema.parse(req.body);
    const reset = await prisma.passwordReset.findUnique({ where: { token: data.token } });
    if (!reset || reset.used || reset.expiresAt < new Date()) {
      throw new ApiError(400, "Ce lien de réinitialisation est invalide ou expiré.");
    }
    const passwordHash = await bcrypt.hash(data.password, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
      prisma.passwordReset.update({ where: { id: reset.id }, data: { used: true } }),
    ]);
    res.json({ ok: true });
  })
);

router.post(
  "/change-password",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    });
    const data = schema.parse(req.body);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
    const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!valid) throw new ApiError(400, "Mot de passe actuel incorrect.");
    const passwordHash = await bcrypt.hash(data.newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    res.json({ ok: true });
  })
);

function publicUser(user: any) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export default router;
