import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/error";

import dashboard from "./dashboard";
import professionals from "./professionals";
import prospects from "./prospects";
import users from "./users";
import bookings from "./bookings";
import moderation from "./moderation";
import settings from "./settings";
import logs from "./logs";
import contact from "./contact";

const router = Router();
router.use(requireAuth, requireRole("ADMIN"));

router.use("/dashboard", dashboard);
router.use("/professionals", professionals);
router.use("/prospects", prospects);
router.use("/users", users);
router.use("/bookings", bookings);
router.use("/moderation", moderation);
router.use("/settings", settings);
router.use("/logs", logs);
router.use("/contact", contact);

router.get(
  "/search",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ professionals: [], clients: [], prospects: [], bookings: [] });
    const [professionalsRes, clientsRes, prospectsRes] = await Promise.all([
      prisma.professionalProfile.findMany({ where: { companyName: { contains: q } }, take: 5 }),
      prisma.user.findMany({ where: { role: "CLIENT", OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }, { email: { contains: q } }] }, take: 5 }),
      prisma.prospectLead.findMany({ where: { businessName: { contains: q } }, take: 5 }),
    ]);
    res.json({
      professionals: professionalsRes,
      clients: clientsRes.map(({ passwordHash, ...c }) => c),
      prospects: prospectsRes,
    });
  })
);

export default router;
