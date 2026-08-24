import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import slugify from "slugify";
import { prisma } from "../../lib/prisma";
import { asyncHandler, ApiError } from "../../middleware/error";
import { AuthedRequest } from "../../middleware/auth";
import { logAdminAction } from "../../lib/adminLog";
import { PROSPECT_STATUSES } from "../../config";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { q, status } = req.query as Record<string, string>;
    const prospects = await prisma.prospectLead.findMany({
      where: {
        ...(q ? { businessName: { contains: q } } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ prospects });
  })
);

const prospectSchema = z.object({
  businessName: z.string().min(1, "Le nom de l'entreprise est requis."),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  city: z.string().optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(PROSPECT_STATUSES).optional(),
});

router.post(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = prospectSchema.parse(req.body);
    const prospect = await prisma.prospectLead.create({ data });
    await logAdminAction(req.user!.id, "create_prospect", "prospect", prospect.id, { businessName: data.businessName });
    res.status(201).json({ prospect });
  })
);

router.put(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const existing = await prisma.prospectLead.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new ApiError(404, "Prospect introuvable.");
    const data = prospectSchema.partial().parse(req.body);
    const prospect = await prisma.prospectLead.update({ where: { id: req.params.id }, data });
    res.json({ prospect });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const existing = await prisma.prospectLead.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new ApiError(404, "Prospect introuvable.");
    await prisma.prospectLead.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

function genTempPassword(): string {
  return crypto.randomBytes(6).toString("base64url");
}

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

const convertSchema = z.object({
  email: z.string().email("Adresse email invalide."),
  contactFirstName: z.string().min(1, "Le prénom est requis."),
  contactLastName: z.string().min(1, "Le nom est requis."),
  city: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  isFounder: z.boolean().optional(),
  verified: z.boolean().optional(),
});

// Convert a prospect directly into an active professional account, carrying over the CRM data
// (business name, phone, city, instagram, tiktok) so the admin only fills in what's missing.
router.post(
  "/:id/convert",
  asyncHandler(async (req: AuthedRequest, res) => {
    const prospect = await prisma.prospectLead.findUnique({ where: { id: req.params.id } });
    if (!prospect) throw new ApiError(404, "Prospect introuvable.");
    if (prospect.convertedProfessionalId) throw new ApiError(409, "Ce prospect a déjà été converti.");

    const data = convertSchema.parse(req.body);
    const existingUser = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existingUser) throw new ApiError(409, "Un compte existe déjà avec cet email.");

    const tempPassword = genTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const slug = await uniqueSlug(prospect.businessName);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash,
          firstName: data.contactFirstName,
          lastName: data.contactLastName,
          phone: prospect.phone ?? undefined,
          role: "PROFESSIONAL",
        },
      });
      const profile = await tx.professionalProfile.create({
        data: {
          userId: user.id,
          slug,
          companyName: prospect.businessName,
          description: data.description ?? "",
          contactEmail: data.email.toLowerCase(),
          phone: prospect.phone,
          instagram: prospect.instagram,
          tiktok: prospect.tiktok,
          city: data.city ?? prospect.city ?? "",
          address: data.address ?? "",
          postalCode: data.postalCode ?? "",
          categoryId: data.categoryId,
          verified: data.verified ?? false,
          isFounder: data.isFounder ?? false,
          founderSince: data.isFounder ? new Date() : null,
          subscriptionPlan: data.isFounder ? "founder" : "free",
          status: "pending",
        },
      });
      await tx.prospectLead.update({
        where: { id: prospect.id },
        data: { status: "account_created", convertedProfessionalId: profile.id },
      });
      return { user, profile };
    });

    await logAdminAction(req.user!.id, "convert_prospect", "prospect", prospect.id, { professionalId: result.profile.id });

    res.status(201).json({
      professional: result.profile,
      credentials: { email: result.user.email, tempPassword },
    });
  })
);

export default router;
