import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/error";

const router = Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });

const schema = z.object({
  name: z.string().min(1, "Le nom est requis."),
  email: z.string().email("Adresse email invalide."),
  subject: z.string().min(1, "Le sujet est requis."),
  message: z.string().min(1, "Le message est requis.").max(5000),
});

router.post(
  "/",
  limiter,
  asyncHandler(async (req, res) => {
    const data = schema.parse(req.body);
    const message = await prisma.contactMessage.create({ data });
    res.status(201).json({ ok: true, id: message.id });
  })
);

export default router;
