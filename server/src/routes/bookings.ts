import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler, ApiError } from "../middleware/error";
import { requireAuth, requireRole, AuthedRequest } from "../middleware/auth";
import { notify } from "../lib/notify";
import { createTransactionForBooking } from "../lib/commission";

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  professionalId: z.string().min(1),
  serviceId: z.string().min(1),
  vehicleId: z.string().optional(),
  date: z.string().min(1, "La date est requise."),
  timeSlot: z.string().min(1, "L'heure est requise."),
  notes: z.string().optional(),
});

router.post(
  "/",
  requireRole("CLIENT"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = createSchema.parse(req.body);
    const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
    if (!service || service.professionalId !== data.professionalId || !service.active) {
      throw new ApiError(400, "Cette prestation n'est plus disponible.");
    }

    const conflict = await prisma.booking.findFirst({
      where: {
        professionalId: data.professionalId,
        date: new Date(data.date),
        timeSlot: data.timeSlot,
        status: { in: ["pending", "confirmed"] },
      },
    });
    if (conflict) throw new ApiError(409, "Ce créneau n'est plus disponible.");

    const booking = await prisma.booking.create({
      data: {
        clientId: req.user!.id,
        professionalId: data.professionalId,
        serviceId: data.serviceId,
        vehicleId: data.vehicleId,
        date: new Date(data.date),
        timeSlot: data.timeSlot,
        price: service.price,
        notes: data.notes,
      },
    });

    const professional = await prisma.professionalProfile.findUniqueOrThrow({ where: { id: data.professionalId } });
    await notify(
      professional.userId,
      "booking",
      "Nouvelle demande de réservation",
      `Nouvelle demande pour "${service.name}" le ${data.date} à ${data.timeSlot}.`,
      "/pro/reservations"
    );

    res.status(201).json({ booking });
  })
);

router.get(
  "/mine",
  requireRole("CLIENT"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const bookings = await prisma.booking.findMany({
      where: { clientId: req.user!.id },
      include: {
        service: true,
        vehicle: true,
        professional: { select: { companyName: true, slug: true, logoUrl: true, city: true } },
        review: true,
      },
      orderBy: { date: "desc" },
    });
    res.json({ bookings });
  })
);

router.get(
  "/pro",
  requireRole("PROFESSIONAL"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const profile = await prisma.professionalProfile.findUnique({ where: { userId: req.user!.id } });
    if (!profile) throw new ApiError(404, "Profil professionnel introuvable.");
    const bookings = await prisma.booking.findMany({
      where: { professionalId: profile.id },
      include: {
        service: true,
        vehicle: true,
        client: { select: { firstName: true, lastName: true, avatarUrl: true, phone: true, email: true } },
      },
      orderBy: { date: "desc" },
    });
    res.json({ bookings });
  })
);

async function getOwnedBooking(id: string, req: AuthedRequest) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { professional: true },
  });
  if (!booking) throw new ApiError(404, "Réservation introuvable.");
  const isClient = req.user!.role === "CLIENT" && booking.clientId === req.user!.id;
  const isPro = req.user!.role === "PROFESSIONAL" && booking.professional.userId === req.user!.id;
  const isAdmin = req.user!.role === "ADMIN";
  if (!isClient && !isPro && !isAdmin) throw new ApiError(403, "Accès refusé.");
  return { booking, isClient, isPro, isAdmin };
}

router.post(
  "/:id/confirm",
  requireRole("PROFESSIONAL", "ADMIN"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { booking } = await getOwnedBooking(req.params.id, req);
    if (booking.status !== "pending") throw new ApiError(400, "Cette réservation ne peut plus être confirmée.");
    const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status: "confirmed" } });
    await notify(booking.clientId, "booking", "Réservation confirmée", "Votre réservation a été confirmée par le professionnel.", "/reservations");
    res.json({ booking: updated });
  })
);

router.post(
  "/:id/refuse",
  requireRole("PROFESSIONAL", "ADMIN"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { booking } = await getOwnedBooking(req.params.id, req);
    if (booking.status !== "pending") throw new ApiError(400, "Cette réservation ne peut plus être refusée.");
    const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status: "refused" } });
    await notify(booking.clientId, "booking", "Réservation refusée", "Votre demande de réservation a été refusée.", "/reservations");
    res.json({ booking: updated });
  })
);

router.post(
  "/:id/cancel",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { booking, isClient, isPro, isAdmin } = await getOwnedBooking(req.params.id, req);
    if (!["pending", "confirmed"].includes(booking.status)) throw new ApiError(400, "Cette réservation ne peut plus être annulée.");
    const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status: "cancelled" } });
    if (isClient) {
      await notify(booking.professional.userId, "booking", "Réservation annulée", "Un client a annulé sa réservation.", "/pro/reservations");
    } else if (isPro || isAdmin) {
      await notify(booking.clientId, "booking", "Réservation annulée", "Votre réservation a été annulée.", "/reservations");
    }
    res.json({ booking: updated });
  })
);

router.post(
  "/:id/complete",
  requireRole("PROFESSIONAL", "ADMIN"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { booking } = await getOwnedBooking(req.params.id, req);
    if (booking.status !== "confirmed") throw new ApiError(400, "Seule une réservation confirmée peut être marquée terminée.");
    const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status: "completed" } });
    await createTransactionForBooking(booking.id);
    await notify(booking.clientId, "booking", "Prestation terminée", "Votre prestation est terminée. Laissez un avis !", "/reservations");
    res.json({ booking: updated });
  })
);

export default router;
