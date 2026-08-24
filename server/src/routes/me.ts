import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/error";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get(
  "/favorites",
  asyncHandler(async (req: AuthedRequest, res) => {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user!.id },
      include: {
        professional: {
          include: { services: { where: { active: true } }, reviews: { select: { rating: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({
      favorites: favorites.map((f) => ({
        favoriteId: f.id,
        professional: {
          id: f.professional.id,
          slug: f.professional.slug,
          companyName: f.professional.companyName,
          logoUrl: f.professional.logoUrl,
          city: f.professional.city,
          minPrice: f.professional.services.length ? Math.min(...f.professional.services.map((s) => s.price)) : null,
          rating: f.professional.reviews.length
            ? Math.round((f.professional.reviews.reduce((s, r) => s + r.rating, 0) / f.professional.reviews.length) * 10) / 10
            : 0,
        },
      })),
    });
  })
);

router.get(
  "/follows",
  asyncHandler(async (req: AuthedRequest, res) => {
    const follows = await prisma.follow.findMany({
      where: { userId: req.user!.id },
      include: { professional: { select: { id: true, slug: true, companyName: true, logoUrl: true, city: true, isFounder: true, verified: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ follows });
  })
);

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().optional(),
  notifyEmail: z.boolean().optional(),
  notifyBooking: z.boolean().optional(),
  notifyLikes: z.boolean().optional(),
  notifyFollows: z.boolean().optional(),
});

router.put(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = updateSchema.parse(req.body);
    const user = await prisma.user.update({ where: { id: req.user!.id }, data });
    const { passwordHash, ...rest } = user;
    res.json({ user: rest });
  })
);

export default router;
