import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler, ApiError } from "../middleware/error";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const vehicles = await prisma.vehicle.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    });
    res.json({ vehicles });
  })
);

router.get(
  "/:id/history",
  asyncHandler(async (req: AuthedRequest, res) => {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!vehicle || vehicle.userId !== req.user!.id) throw new ApiError(404, "Véhicule introuvable.");
    const bookings = await prisma.booking.findMany({
      where: { vehicleId: vehicle.id, status: "completed" },
      include: { service: true, professional: { select: { companyName: true, slug: true } }, review: true },
      orderBy: { date: "desc" },
    });
    res.json({ bookings });
  })
);

const vehicleSchema = z.object({
  make: z.string().min(1, "La marque est requise."),
  model: z.string().min(1, "Le modèle est requis."),
  year: z.coerce.number().optional(),
  color: z.string().optional(),
  mileage: z.coerce.number().optional(),
  photoUrl: z.string().optional(),
  plate: z.string().optional(),
  nickname: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

router.post(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = vehicleSchema.parse(req.body);
    if (data.isPrimary) {
      await prisma.vehicle.updateMany({ where: { userId: req.user!.id }, data: { isPrimary: false } });
    }
    const vehicle = await prisma.vehicle.create({ data: { ...data, userId: req.user!.id } });
    res.status(201).json({ vehicle });
  })
);

router.put(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const existing = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw new ApiError(404, "Véhicule introuvable.");
    const data = vehicleSchema.partial().parse(req.body);
    if (data.isPrimary) {
      await prisma.vehicle.updateMany({ where: { userId: req.user!.id }, data: { isPrimary: false } });
    }
    const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data });
    res.json({ vehicle });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const existing = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw new ApiError(404, "Véhicule introuvable.");
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

export default router;
