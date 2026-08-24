import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/error";

const router = Router();

// Global public search: professionals, services, cities — used by the header search bar (§11).
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ professionals: [], services: [], cities: [] });

    const [professionals, services, cityRows] = await Promise.all([
      prisma.professionalProfile.findMany({
        where: { status: "active", companyName: { contains: q } },
        select: { id: true, slug: true, companyName: true, city: true, logoUrl: true },
        take: 5,
      }),
      prisma.service.findMany({
        where: { active: true, name: { contains: q }, professional: { status: "active" } },
        select: { id: true, name: true, price: true, professional: { select: { slug: true, companyName: true } } },
        take: 5,
      }),
      prisma.professionalProfile.findMany({
        where: { status: "active", city: { contains: q } },
        select: { city: true },
        distinct: ["city"],
        take: 5,
      }),
    ]);

    res.json({
      professionals,
      services,
      cities: cityRows.map((c) => c.city).filter(Boolean),
    });
  })
);

export default router;
