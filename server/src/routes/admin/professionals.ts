import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import slugify from "slugify";
import { prisma } from "../../lib/prisma";
import { asyncHandler, ApiError } from "../../middleware/error";
import { AuthedRequest } from "../../middleware/auth";
import { logAdminAction } from "../../lib/adminLog";
import { notify } from "../../lib/notify";

const router = Router();

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base, { lower: true, strict: true }) || "professionnel";
  let slug = root;
  let i = 1;
  while (await prisma.professionalProfile.findUnique({ where: { slug } })) {
    i += 1;
    slug = `${root}-${i}`;
  }
  return slug;
}

function genTempPassword(): string {
  return crypto.randomBytes(6).toString("base64url");
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { q, status, plan, verified, founder, page = "1", limit = "20" } = req.query as Record<string, string>;
    const professionals = await prisma.professionalProfile.findMany({
      where: {
        ...(q ? { companyName: { contains: q } } : {}),
        ...(status ? { status } : {}),
        ...(plan ? { subscriptionPlan: plan } : {}),
        ...(verified ? { verified: verified === "true" } : {}),
        ...(founder ? { isFounder: founder === "true" } : {}),
      },
      include: {
        user: { select: { email: true, createdAt: true } },
        bookings: { select: { id: true, price: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    const total = professionals.length;
    const p = Number(page);
    const l = Number(limit);
    const paged = professionals.slice((p - 1) * l, p * l).map((pro) => ({
      ...pro,
      bookingCount: pro.bookings.length,
      revenue: pro.bookings.filter((b) => b.status === "completed").reduce((s, b) => s + b.price, 0),
    }));
    res.json({ professionals: paged, total, page: p, totalPages: Math.ceil(total / l) });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const professional = await prisma.professionalProfile.findUnique({
      where: { id: req.params.id },
      include: { user: true, category: true, services: true, businessHours: true, galleryImages: true, bookings: true, reviews: true },
    });
    if (!professional) throw new ApiError(404, "Professionnel introuvable.");
    const { user, ...rest } = professional;
    const { passwordHash, ...safeUser } = user;
    res.json({ professional: { ...rest, user: safeUser } });
  })
);

const createSchema = z.object({
  companyName: z.string().min(1, "Le nom de l'entreprise est requis."),
  contactFirstName: z.string().min(1, "Le prénom est requis."),
  contactLastName: z.string().min(1, "Le nom est requis."),
  email: z.string().email("Adresse email invalide."),
  phone: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  website: z.string().optional(),
  logoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  verified: z.boolean().optional(),
  isFounder: z.boolean().optional(),
});

router.post(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = createSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) throw new ApiError(409, "Un compte existe déjà avec cet email.");

    const tempPassword = genTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const slug = await uniqueSlug(data.companyName);

    const commissionSetting = await prisma.commissionSetting.findUnique({
      where: { plan: data.isFounder ? "founder" : "free" },
    });

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash,
          firstName: data.contactFirstName,
          lastName: data.contactLastName,
          phone: data.phone,
          role: "PROFESSIONAL",
        },
      });
      const profile = await tx.professionalProfile.create({
        data: {
          userId: user.id,
          slug,
          companyName: data.companyName,
          description: data.description ?? "",
          contactEmail: data.email.toLowerCase(),
          phone: data.phone,
          address: data.address ?? "",
          city: data.city ?? "",
          postalCode: data.postalCode ?? "",
          latitude: data.latitude,
          longitude: data.longitude,
          website: data.website,
          instagram: data.instagram,
          tiktok: data.tiktok,
          logoUrl: data.logoUrl,
          coverUrl: data.coverUrl,
          categoryId: data.categoryId,
          verified: data.verified ?? false,
          isFounder: data.isFounder ?? false,
          founderSince: data.isFounder ? new Date() : null,
          subscriptionPlan: data.isFounder ? "founder" : "free",
          status: "pending",
        },
      });
      return { user, profile };
    });

    await logAdminAction(req.user!.id, "create_professional", "professional", result.profile.id, { companyName: data.companyName, isFounder: data.isFounder });

    res.status(201).json({
      professional: result.profile,
      credentials: { email: result.user.email, tempPassword },
      activationUrl: `/pro/connexion`,
      commissionRate: commissionSetting?.ratePercent ?? 0,
    });
  })
);

const updateSchema = createSchema.partial().extend({
  status: z.enum(["pending", "active", "suspended", "inactive"]).optional(),
});

router.put(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const professional = await prisma.professionalProfile.findUnique({ where: { id: req.params.id } });
    if (!professional) throw new ApiError(404, "Professionnel introuvable.");
    const data = updateSchema.parse(req.body);
    const updated = await prisma.professionalProfile.update({ where: { id: professional.id }, data });
    await logAdminAction(req.user!.id, "update_professional", "professional", professional.id, data);
    res.json({ professional: updated });
  })
);

router.post(
  "/:id/status",
  asyncHandler(async (req: AuthedRequest, res) => {
    const schema = z.object({ status: z.enum(["pending", "active", "suspended", "inactive"]) });
    const { status } = schema.parse(req.body);
    const professional = await prisma.professionalProfile.findUnique({ where: { id: req.params.id } });
    if (!professional) throw new ApiError(404, "Professionnel introuvable.");
    const updated = await prisma.professionalProfile.update({ where: { id: professional.id }, data: { status } });
    await logAdminAction(req.user!.id, `status_${status}`, "professional", professional.id);
    await notify(professional.userId, "system", "Statut du profil mis à jour", `Votre profil est maintenant : ${status}.`, "/pro/profil");
    res.json({ professional: updated });
  })
);

router.post(
  "/:id/verify",
  asyncHandler(async (req: AuthedRequest, res) => {
    const schema = z.object({ verified: z.boolean() });
    const { verified } = schema.parse(req.body);
    const professional = await prisma.professionalProfile.findUnique({ where: { id: req.params.id } });
    if (!professional) throw new ApiError(404, "Professionnel introuvable.");
    const updated = await prisma.professionalProfile.update({ where: { id: professional.id }, data: { verified } });
    await logAdminAction(req.user!.id, verified ? "verify" : "unverify", "professional", professional.id);
    if (verified) {
      await notify(professional.userId, "verified", "Profil vérifié", "Félicitations, votre profil VEYZA est désormais vérifié !", "/pro/profil");
    }
    res.json({ professional: updated });
  })
);

router.post(
  "/:id/founder",
  asyncHandler(async (req: AuthedRequest, res) => {
    const schema = z.object({ isFounder: z.boolean() });
    const { isFounder } = schema.parse(req.body);
    const professional = await prisma.professionalProfile.findUnique({ where: { id: req.params.id } });
    if (!professional) throw new ApiError(404, "Professionnel introuvable.");
    const updated = await prisma.professionalProfile.update({
      where: { id: professional.id },
      data: {
        isFounder,
        founderSince: isFounder ? professional.founderSince ?? new Date() : professional.founderSince,
        subscriptionPlan: isFounder ? "founder" : "free",
      },
    });
    await logAdminAction(req.user!.id, isFounder ? "grant_founder" : "revoke_founder", "professional", professional.id);
    res.json({ professional: updated });
  })
);

router.post(
  "/:id/plan",
  asyncHandler(async (req: AuthedRequest, res) => {
    const schema = z.object({ plan: z.enum(["free", "pro", "business", "founder"]), commissionOverride: z.number().nullable().optional() });
    const data = schema.parse(req.body);
    const professional = await prisma.professionalProfile.findUnique({ where: { id: req.params.id } });
    if (!professional) throw new ApiError(404, "Professionnel introuvable.");
    if (professional.isFounder && data.plan !== "founder") {
      throw new ApiError(400, "Un Founding Partner ne peut pas être rétrogradé d'un autre plan que founder.");
    }
    const updated = await prisma.professionalProfile.update({
      where: { id: professional.id },
      data: { subscriptionPlan: data.plan, commissionOverride: data.commissionOverride ?? null },
    });
    await logAdminAction(req.user!.id, "update_plan", "professional", professional.id, data);
    res.json({ professional: updated });
  })
);

router.post(
  "/:id/reset-access",
  asyncHandler(async (req: AuthedRequest, res) => {
    const professional = await prisma.professionalProfile.findUnique({ where: { id: req.params.id } });
    if (!professional) throw new ApiError(404, "Professionnel introuvable.");
    const tempPassword = genTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    await prisma.user.update({ where: { id: professional.userId }, data: { passwordHash } });
    await logAdminAction(req.user!.id, "reset_access", "professional", professional.id);
    res.json({ ok: true, tempPassword });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const professional = await prisma.professionalProfile.findUnique({ where: { id: req.params.id } });
    if (!professional) throw new ApiError(404, "Professionnel introuvable.");
    await prisma.user.delete({ where: { id: professional.userId } });
    await logAdminAction(req.user!.id, "delete_professional", "professional", professional.id, { companyName: professional.companyName });
    res.json({ ok: true });
  })
);

export default router;
