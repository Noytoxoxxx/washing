import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler, ApiError } from "../middleware/error";
import { requireAuth, requireRole, AuthedRequest } from "../middleware/auth";
import { notify } from "../lib/notify";

const router = Router();

const createSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.coerce.number().min(1).max(5),
  text: z.string().max(2000).optional(),
});

router.post(
  "/",
  requireAuth,
  requireRole("CLIENT"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = createSchema.parse(req.body);
    const booking = await prisma.booking.findUnique({ where: { id: data.bookingId }, include: { professional: true } });
    if (!booking || booking.clientId !== req.user!.id) throw new ApiError(404, "Réservation introuvable.");
    if (booking.status !== "completed") throw new ApiError(400, "Seule une prestation terminée peut être notée.");

    const existing = await prisma.review.findUnique({ where: { bookingId: booking.id } });
    if (existing) throw new ApiError(409, "Vous avez déjà laissé un avis pour cette réservation.");

    const review = await prisma.review.create({
      data: {
        bookingId: booking.id,
        professionalId: booking.professionalId,
        clientId: req.user!.id,
        rating: data.rating,
        text: data.text ?? "",
      },
    });
    await notify(booking.professional.userId, "review", "Nouvel avis", `Vous avez reçu un avis ${data.rating}/5.`, "/pro/profil");
    res.status(201).json({ review });
  })
);

router.get(
  "/professional/:professionalId",
  asyncHandler(async (req, res) => {
    const sort = (req.query.sort as string) || "recent";
    const orderBy =
      sort === "highest" ? { rating: "desc" as const } : sort === "lowest" ? { rating: "asc" as const } : { createdAt: "desc" as const };
    const reviews = await prisma.review.findMany({
      where: { professionalId: req.params.professionalId, reported: false },
      include: { client: { select: { firstName: true, lastName: true, avatarUrl: true } } },
      orderBy,
    });
    res.json({ reviews });
  })
);

router.post(
  "/:id/report",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) throw new ApiError(404, "Avis introuvable.");
    await prisma.report.create({
      data: { targetType: "review", targetId: review.id, reporterId: req.user!.id, reason: req.body?.reason || "Signalement utilisateur" },
    });
    res.json({ ok: true });
  })
);

export default router;
