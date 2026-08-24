import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler, ApiError } from "../../middleware/error";
import { AuthedRequest } from "../../middleware/auth";
import { logAdminAction } from "../../lib/adminLog";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { q, role, page = "1", limit = "20" } = req.query as Record<string, string>;
    const where = {
      ...(q ? { OR: [{ email: { contains: q } }, { firstName: { contains: q } }, { lastName: { contains: q } }] } : {}),
      ...(role ? { role } : {}),
    };
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.user.count({ where }),
    ]);
    res.json({
      users: users.map(({ passwordHash, ...u }) => u),
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { professionalProfile: true, vehicles: true, bookingsAsClient: true },
    });
    if (!user) throw new ApiError(404, "Utilisateur introuvable.");
    const { passwordHash, ...rest } = user;
    res.json({ user: rest });
  })
);

router.post(
  "/:id/status",
  asyncHandler(async (req: AuthedRequest, res) => {
    const schema = z.object({ status: z.enum(["active", "suspended"]) });
    const { status } = schema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new ApiError(404, "Utilisateur introuvable.");
    if (user.role === "ADMIN") throw new ApiError(400, "Impossible de suspendre un administrateur.");
    const updated = await prisma.user.update({ where: { id: user.id }, data: { status } });
    await logAdminAction(req.user!.id, `user_${status}`, "user", user.id);
    const { passwordHash, ...rest } = updated;
    res.json({ user: rest });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new ApiError(404, "Utilisateur introuvable.");
    if (user.role === "ADMIN") throw new ApiError(400, "Impossible de supprimer un administrateur.");
    await prisma.user.delete({ where: { id: user.id } });
    await logAdminAction(req.user!.id, "delete_user", "user", user.id, { email: user.email });
    res.json({ ok: true });
  })
);

export default router;
