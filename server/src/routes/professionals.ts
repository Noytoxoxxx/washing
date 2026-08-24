import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler, ApiError } from "../middleware/error";
import { attachUser, requireAuth, AuthedRequest } from "../middleware/auth";
import { notify } from "../lib/notify";

const router = Router();

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isOpenNow(hours: { dayOfWeek: number; openTime: string | null; closeTime: string | null; closed: boolean }[]) {
  const now = new Date();
  const today = hours.find((h) => h.dayOfWeek === now.getDay());
  if (!today || today.closed || !today.openTime || !today.closeTime) return false;
  const [oh, om] = today.openTime.split(":").map(Number);
  const [ch, cm] = today.closeTime.split(":").map(Number);
  const openMinutes = oh * 60 + om;
  const closeMinutes = ch * 60 + cm;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
}

function avgRating(reviews: { rating: number }[]) {
  if (reviews.length === 0) return 0;
  return Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;
}

const listSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minRating: z.coerce.number().optional(),
  homeService: z.coerce.boolean().optional(),
  verified: z.coerce.boolean().optional(),
  founder: z.coerce.boolean().optional(),
  openNow: z.coerce.boolean().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().optional(),
  sort: z.enum(["relevance", "distance", "rating", "price_asc", "price_desc", "popularity"]).optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(50).optional(),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = listSchema.parse(req.query);
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;

    const professionals = await prisma.professionalProfile.findMany({
      where: {
        status: "active",
        ...(q.city ? { city: { contains: q.city } } : {}),
        ...(q.category ? { category: { slug: q.category } } : {}),
        ...(q.q ? { companyName: { contains: q.q } } : {}),
        ...(q.homeService ? { homeService: true } : {}),
        ...(q.verified ? { verified: true } : {}),
        ...(q.founder ? { isFounder: true } : {}),
      },
      include: {
        category: true,
        services: { where: { active: true } },
        reviews: { select: { rating: true } },
        businessHours: true,
        favoritedBy: true,
        followedBy: true,
        bookings: { select: { id: true } },
      },
    });

    let results = professionals.map((p) => {
      const rating = avgRating(p.reviews);
      const minPrice = p.services.length ? Math.min(...p.services.map((s) => s.price)) : null;
      const distance =
        q.lat != null && q.lng != null && p.latitude != null && p.longitude != null
          ? haversineKm(q.lat, q.lng, p.latitude, p.longitude)
          : null;
      return {
        id: p.id,
        slug: p.slug,
        companyName: p.companyName,
        logoUrl: p.logoUrl,
        coverUrl: p.coverUrl,
        city: p.city,
        category: p.category,
        verified: p.verified,
        isFounder: p.isFounder,
        homeService: p.homeService,
        latitude: p.latitude,
        longitude: p.longitude,
        rating,
        reviewCount: p.reviews.length,
        minPrice,
        distance,
        openNow: isOpenNow(p.businessHours),
        favoriteCount: p.favoritedBy.length,
        followerCount: p.followedBy.length,
        bookingCount: p.bookings.length,
      };
    });

    if (q.minPrice != null) results = results.filter((r) => r.minPrice == null || r.minPrice >= q.minPrice!);
    if (q.maxPrice != null) results = results.filter((r) => r.minPrice == null || r.minPrice <= q.maxPrice!);
    if (q.minRating != null) results = results.filter((r) => r.rating >= q.minRating!);
    if (q.openNow) results = results.filter((r) => r.openNow);
    if (q.radiusKm != null) results = results.filter((r) => r.distance == null || r.distance <= q.radiusKm!);

    switch (q.sort) {
      case "distance":
        results.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
        break;
      case "rating":
        results.sort((a, b) => b.rating - a.rating);
        break;
      case "price_asc":
        results.sort((a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity));
        break;
      case "price_desc":
        results.sort((a, b) => (b.minPrice ?? -Infinity) - (a.minPrice ?? -Infinity));
        break;
      case "popularity":
        results.sort((a, b) => b.bookingCount + b.followerCount - (a.bookingCount + a.followerCount));
        break;
      default:
        results.sort((a, b) => Number(b.isFounder) - Number(a.isFounder) || b.rating - a.rating);
    }

    const total = results.length;
    const paged = results.slice((page - 1) * limit, page * limit);
    res.json({ professionals: paged, total, page, limit, totalPages: Math.ceil(total / limit) });
  })
);

router.get(
  "/:slug",
  attachUser,
  asyncHandler(async (req: AuthedRequest, res) => {
    const p = await prisma.professionalProfile.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: true,
        services: { where: { active: true }, orderBy: { position: "asc" } },
        galleryImages: { orderBy: { position: "asc" } },
        businessHours: { orderBy: { dayOfWeek: "asc" } },
        reviews: { include: { client: { select: { firstName: true, lastName: true, avatarUrl: true } } }, orderBy: { createdAt: "desc" } },
        posts: { orderBy: { createdAt: "desc" }, take: 12 },
      },
    });
    if (!p || (p.status !== "active" && req.user?.role !== "ADMIN")) {
      throw new ApiError(404, "Ce professionnel n'existe pas.");
    }

    await prisma.professionalProfile.update({ where: { id: p.id }, data: { viewCount: { increment: 1 } } });

    let isFavorite = false;
    let isFollowing = false;
    if (req.user) {
      const [fav, fol] = await Promise.all([
        prisma.favorite.findUnique({ where: { userId_professionalId: { userId: req.user.id, professionalId: p.id } } }),
        prisma.follow.findUnique({ where: { userId_professionalId: { userId: req.user.id, professionalId: p.id } } }),
      ]);
      isFavorite = !!fav;
      isFollowing = !!fol;
    }

    res.json({
      professional: { ...p, rating: avgRating(p.reviews), openNow: isOpenNow(p.businessHours) },
      isFavorite,
      isFollowing,
    });
  })
);

router.post(
  "/:id/favorite",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const professionalId = req.params.id;
    const existing = await prisma.favorite.findUnique({
      where: { userId_professionalId: { userId: req.user!.id, professionalId } },
    });
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return res.json({ favorited: false });
    }
    await prisma.favorite.create({ data: { userId: req.user!.id, professionalId } });
    res.json({ favorited: true });
  })
);

router.post(
  "/:id/follow",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const professionalId = req.params.id;
    const existing = await prisma.follow.findUnique({
      where: { userId_professionalId: { userId: req.user!.id, professionalId } },
    });
    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      return res.json({ following: false });
    }
    await prisma.follow.create({ data: { userId: req.user!.id, professionalId } });
    const professional = await prisma.professionalProfile.findUnique({ where: { id: professionalId } });
    if (professional) {
      await notify(professional.userId, "follow", "Nouvel abonné", "Un utilisateur s'est abonné à votre profil.", `/pro/clients`);
    }
    res.json({ following: true });
  })
);

export default router;
