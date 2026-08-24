import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/error";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status, professionalId, clientId, page = "1", limit = "20" } = req.query as Record<string, string>;
    const where = {
      ...(status ? { status } : {}),
      ...(professionalId ? { professionalId } : {}),
      ...(clientId ? { clientId } : {}),
    };
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          client: { select: { firstName: true, lastName: true, email: true } },
          professional: { select: { companyName: true, slug: true } },
          service: { select: { name: true } },
          transaction: true,
        },
        orderBy: { date: "desc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.booking.count({ where }),
    ]);
    res.json({ bookings, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  })
);

export default router;
