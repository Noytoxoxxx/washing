import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler, ApiError } from "../../middleware/error";
import { AuthedRequest } from "../../middleware/auth";
import { logAdminAction } from "../../lib/adminLog";

const router = Router();

router.get(
  "/plans",
  asyncHandler(async (_req, res) => {
    const settings = await prisma.commissionSetting.findMany({ orderBy: { priceMonthly: "asc" } });
    const counts = await prisma.professionalProfile.groupBy({ by: ["subscriptionPlan"], _count: true });
    const countByPlan = Object.fromEntries(counts.map((c) => [c.subscriptionPlan, c._count]));
    res.json({ plans: settings.map((s) => ({ ...s, accountCount: countByPlan[s.plan] ?? 0 })) });
  })
);

const updateSchema = z.object({
  label: z.string().min(1).optional(),
  ratePercent: z.coerce.number().min(0).max(100).optional(),
  priceMonthly: z.coerce.number().min(0).optional(),
});

router.put(
  "/plans/:plan",
  asyncHandler(async (req: AuthedRequest, res) => {
    const plan = req.params.plan;
    if (plan === "founder") {
      const data = updateSchema.parse(req.body);
      if (data.priceMonthly && data.priceMonthly > 0) {
        throw new ApiError(400, "Le plan Founding Partner doit rester gratuit (0 €/mois) — c'est une règle produit permanente.");
      }
    }
    const existing = await prisma.commissionSetting.findUnique({ where: { plan } });
    if (!existing) throw new ApiError(404, "Plan introuvable.");
    const data = updateSchema.parse(req.body);
    const updated = await prisma.commissionSetting.update({ where: { plan }, data });
    await logAdminAction(req.user!.id, "update_plan_settings", "commission_setting", plan, data);
    res.json({ plan: updated });
  })
);

export default router;
