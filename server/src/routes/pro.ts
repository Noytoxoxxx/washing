import { Router } from "express";
import { z } from "zod";
import slugify from "slugify";
import { prisma } from "../lib/prisma";
import { asyncHandler, ApiError } from "../middleware/error";
import { requireAuth, requireRole, AuthedRequest } from "../middleware/auth";
import { recomputeProfileCompletion } from "../lib/onboarding";

const router = Router();
router.use(requireAuth, requireRole("PROFESSIONAL"));

async function getProfile(req: AuthedRequest) {
  const profile = await prisma.professionalProfile.findUnique({ where: { userId: req.user!.id } });
  if (!profile) throw new ApiError(404, "Profil professionnel introuvable.");
  return profile;
}

async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const root = slugify(base, { lower: true, strict: true }) || "professionnel";
  let slug = root;
  let i = 1;
  while (true) {
    const existing = await prisma.professionalProfile.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    i += 1;
    slug = `${root}-${i}`;
  }
}

router.get(
  "/me",
  asyncHandler(async (req: AuthedRequest, res) => {
    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: req.user!.id },
      include: { category: true, businessHours: true, services: true, galleryImages: true },
    });
    if (!profile) throw new ApiError(404, "Profil professionnel introuvable.");
    res.json({ profile });
  })
);

router.get(
  "/dashboard",
  asyncHandler(async (req: AuthedRequest, res) => {
    const profile = await getProfile(req);
    const [bookings, reviews, posts, followerCount, favoriteCount] = await Promise.all([
      prisma.booking.findMany({ where: { professionalId: profile.id }, include: { service: true, client: { select: { firstName: true, lastName: true } } } }),
      prisma.review.findMany({ where: { professionalId: profile.id } }),
      prisma.post.count({ where: { professionalId: profile.id } }),
      prisma.follow.count({ where: { professionalId: profile.id } }),
      prisma.favorite.count({ where: { professionalId: profile.id } }),
    ]);

    const completed = bookings.filter((b) => b.status === "completed");
    const revenue = completed.reduce((s, b) => s + b.price, 0);
    const rating = reviews.length ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0;
    const upcoming = bookings
      .filter((b) => ["pending", "confirmed"].includes(b.status) && b.date >= new Date(new Date().toDateString()))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    res.json({
      profile,
      kpis: {
        totalBookings: bookings.length,
        pendingBookings: bookings.filter((b) => b.status === "pending").length,
        revenue,
        viewCount: profile.viewCount,
        rating,
        reviewCount: reviews.length,
        postCount: posts,
        followerCount,
        favoriteCount,
        profileCompletion: profile.profileCompletion,
      },
      recentBookings: bookings.slice(0, 5),
      nextBooking: upcoming[0] ?? null,
    });
  })
);

const profileSchema = z.object({
  companyName: z.string().min(1).optional(),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  phone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  website: z.string().optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  homeService: z.boolean().optional(),
  serviceRadiusKm: z.coerce.number().optional(),
  categoryId: z.string().optional(),
  onboardingStep: z.coerce.number().optional(),
});

router.put(
  "/me",
  asyncHandler(async (req: AuthedRequest, res) => {
    const profile = await getProfile(req);
    const data = profileSchema.parse(req.body);
    let slug = profile.slug;
    if (data.companyName && data.companyName !== profile.companyName) {
      slug = await uniqueSlug(data.companyName, profile.id);
    }
    const updated = await prisma.professionalProfile.update({
      where: { id: profile.id },
      data: { ...data, slug },
    });
    await recomputeProfileCompletion(profile.id);
    res.json({ profile: await prisma.professionalProfile.findUnique({ where: { id: profile.id }, include: { category: true, businessHours: true } }) });
  })
);

const hoursSchema = z.array(
  z.object({
    dayOfWeek: z.number().min(0).max(6),
    openTime: z.string().nullable().optional(),
    closeTime: z.string().nullable().optional(),
    closed: z.boolean().default(false),
  })
);

router.put(
  "/me/hours",
  asyncHandler(async (req: AuthedRequest, res) => {
    const profile = await getProfile(req);
    const data = hoursSchema.parse(req.body);
    await prisma.$transaction(
      data.map((h) =>
        prisma.businessHour.upsert({
          where: { professionalId_dayOfWeek: { professionalId: profile.id, dayOfWeek: h.dayOfWeek } },
          create: { professionalId: profile.id, ...h },
          update: h,
        })
      )
    );
    await recomputeProfileCompletion(profile.id);
    const hours = await prisma.businessHour.findMany({ where: { professionalId: profile.id }, orderBy: { dayOfWeek: "asc" } });
    res.json({ hours });
  })
);

// ---------- SERVICES ----------

const serviceSchema = z.object({
  name: z.string().min(1, "Le nom est requis."),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Le prix doit être positif."),
  durationMinutes: z.coerce.number().min(1, "La durée doit être positive."),
  photoUrl: z.string().optional(),
  active: z.boolean().optional(),
});

router.get(
  "/services",
  asyncHandler(async (req: AuthedRequest, res) => {
    const profile = await getProfile(req);
    const services = await prisma.service.findMany({ where: { professionalId: profile.id }, orderBy: { position: "asc" } });
    res.json({ services });
  })
);

router.post(
  "/services",
  asyncHandler(async (req: AuthedRequest, res) => {
    const profile = await getProfile(req);
    const data = serviceSchema.parse(req.body);
    const count = await prisma.service.count({ where: { professionalId: profile.id } });
    const service = await prisma.service.create({ data: { ...data, professionalId: profile.id, position: count } });
    await recomputeProfileCompletion(profile.id);
    res.status(201).json({ service });
  })
);

router.put(
  "/services/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const profile = await getProfile(req);
    const existing = await prisma.service.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.professionalId !== profile.id) throw new ApiError(404, "Prestation introuvable.");
    const data = serviceSchema.partial().parse(req.body);
    const service = await prisma.service.update({ where: { id: req.params.id }, data });
    res.json({ service });
  })
);

router.delete(
  "/services/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const profile = await getProfile(req);
    const existing = await prisma.service.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.professionalId !== profile.id) throw new ApiError(404, "Prestation introuvable.");
    await prisma.service.delete({ where: { id: req.params.id } });
    await recomputeProfileCompletion(profile.id);
    res.json({ ok: true });
  })
);

router.put(
  "/services/reorder",
  asyncHandler(async (req: AuthedRequest, res) => {
    const profile = await getProfile(req);
    const order = z.array(z.string()).parse(req.body.order);
    await prisma.$transaction(
      order.map((id, position) =>
        prisma.service.updateMany({ where: { id, professionalId: profile.id }, data: { position } })
      )
    );
    res.json({ ok: true });
  })
);

// ---------- GALLERY ----------

const galleryCreateSchema = z.object({
  url: z.string().min(1),
  isBeforeAfter: z.boolean().optional(),
  pairUrl: z.string().optional(),
});

router.get(
  "/gallery",
  asyncHandler(async (req: AuthedRequest, res) => {
    const profile = await getProfile(req);
    const images = await prisma.galleryImage.findMany({ where: { professionalId: profile.id }, orderBy: { position: "asc" } });
    res.json({ images });
  })
);

router.post(
  "/gallery",
  asyncHandler(async (req: AuthedRequest, res) => {
    const profile = await getProfile(req);
    const data = galleryCreateSchema.parse(req.body);
    const count = await prisma.galleryImage.count({ where: { professionalId: profile.id } });
    const image = await prisma.galleryImage.create({
      data: { ...data, professionalId: profile.id, position: count, isCover: count === 0 },
    });
    await recomputeProfileCompletion(profile.id);
    res.status(201).json({ image });
  })
);

router.delete(
  "/gallery/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const profile = await getProfile(req);
    const existing = await prisma.galleryImage.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.professionalId !== profile.id) throw new ApiError(404, "Image introuvable.");
    await prisma.galleryImage.delete({ where: { id: req.params.id } });
    await recomputeProfileCompletion(profile.id);
    res.json({ ok: true });
  })
);

router.put(
  "/gallery/:id/cover",
  asyncHandler(async (req: AuthedRequest, res) => {
    const profile = await getProfile(req);
    const existing = await prisma.galleryImage.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.professionalId !== profile.id) throw new ApiError(404, "Image introuvable.");
    await prisma.$transaction([
      prisma.galleryImage.updateMany({ where: { professionalId: profile.id }, data: { isCover: false } }),
      prisma.galleryImage.update({ where: { id: req.params.id }, data: { isCover: true } }),
    ]);
    res.json({ ok: true });
  })
);

router.put(
  "/gallery/reorder",
  asyncHandler(async (req: AuthedRequest, res) => {
    const profile = await getProfile(req);
    const order = z.array(z.string()).parse(req.body.order);
    await prisma.$transaction(
      order.map((id, position) => prisma.galleryImage.updateMany({ where: { id, professionalId: profile.id }, data: { position } }))
    );
    res.json({ ok: true });
  })
);

// ---------- CLIENTS ----------

router.get(
  "/clients",
  asyncHandler(async (req: AuthedRequest, res) => {
    const profile = await getProfile(req);
    const bookings = await prisma.booking.findMany({
      where: { professionalId: profile.id },
      include: { client: true, service: true },
      orderBy: { date: "desc" },
    });
    const byClient = new Map<string, any>();
    for (const b of bookings) {
      const existing = byClient.get(b.clientId) ?? {
        client: b.client,
        bookingCount: 0,
        totalSpent: 0,
        lastBookingDate: b.date,
        vehicles: new Set<string>(),
      };
      existing.bookingCount += 1;
      if (b.status === "completed") existing.totalSpent += b.price;
      if (b.date > existing.lastBookingDate) existing.lastBookingDate = b.date;
      byClient.set(b.clientId, existing);
    }
    const search = (req.query.q as string)?.toLowerCase();
    let clients = Array.from(byClient.values()).map((c) => {
      const { passwordHash, ...client } = c.client;
      return { ...c, client };
    });
    if (search) {
      clients = clients.filter((c) => `${c.client.firstName} ${c.client.lastName}`.toLowerCase().includes(search));
    }
    res.json({ clients });
  })
);

// ---------- STATS ----------

router.get(
  "/stats",
  asyncHandler(async (req: AuthedRequest, res) => {
    const profile = await getProfile(req);
    const period = (req.query.period as string) || "30d";
    const since = new Date();
    if (period === "7d") since.setDate(since.getDate() - 7);
    else if (period === "30d") since.setDate(since.getDate() - 30);
    else if (period === "3m") since.setMonth(since.getMonth() - 3);
    else if (period === "12m") since.setFullYear(since.getFullYear() - 1);
    else since.setFullYear(2000);

    const [bookings, reviews, posts, followers, likes] = await Promise.all([
      prisma.booking.findMany({ where: { professionalId: profile.id, createdAt: { gte: since } } }),
      prisma.review.findMany({ where: { professionalId: profile.id, createdAt: { gte: since } } }),
      prisma.post.findMany({ where: { professionalId: profile.id, createdAt: { gte: since } }, include: { _count: { select: { likes: true } } } }),
      prisma.follow.count({ where: { professionalId: profile.id, createdAt: { gte: since } } }),
      0,
    ]);

    const revenue = bookings.filter((b) => b.status === "completed").reduce((s, b) => s + b.price, 0);
    const commissionSetting = await prisma.commissionSetting.findUnique({ where: { plan: profile.subscriptionPlan } });
    const rate = profile.commissionOverride ?? commissionSetting?.ratePercent ?? 0;

    res.json({
      period,
      viewCount: profile.viewCount,
      bookingCount: bookings.length,
      revenue,
      commission: Math.round(revenue * (rate / 100) * 100) / 100,
      newClients: new Set(bookings.map((b) => b.clientId)).size,
      rating: reviews.length ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0,
      postCount: posts.length,
      likeCount: posts.reduce((s, p) => s + p._count.likes, 0),
      newFollowers: followers,
    });
  })
);

export default router;
