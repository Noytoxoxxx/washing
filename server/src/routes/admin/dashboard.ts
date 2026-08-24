import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/error";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const [
      totalUsers,
      totalClients,
      totalProfessionals,
      totalFounders,
      totalProspects,
      totalBookings,
      totalPosts,
      totalReviews,
      transactions,
      recentBookings,
      recentProfessionals,
      recentProspects,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.professionalProfile.count(),
      prisma.professionalProfile.count({ where: { isFounder: true } }),
      prisma.prospectLead.count(),
      prisma.booking.count(),
      prisma.post.count(),
      prisma.review.count(),
      prisma.transaction.findMany(),
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { professional: { select: { companyName: true } }, client: { select: { firstName: true, lastName: true } } },
      }),
      prisma.professionalProfile.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { user: true } }),
      prisma.prospectLead.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
    ]);

    const revenue = transactions.reduce((s, t) => s + t.grossAmount, 0);
    const commissions = transactions.reduce((s, t) => s + t.commissionAmount, 0);

    res.json({
      kpis: {
        totalUsers,
        totalClients,
        totalProfessionals,
        totalFounders,
        totalProspects,
        totalBookings,
        totalPosts,
        totalReviews,
        revenue,
        commissions,
      },
      recentBookings,
      recentProfessionals,
      recentProspects,
    });
  })
);

export default router;
