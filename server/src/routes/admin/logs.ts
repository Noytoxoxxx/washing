import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/error";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 50);
    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        include: { admin: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.adminLog.count(),
    ]);
    res.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
  })
);

export default router;
