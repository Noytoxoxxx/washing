import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler, ApiError } from "../../middleware/error";
import { AuthedRequest } from "../../middleware/auth";
import { logAdminAction } from "../../lib/adminLog";

const router = Router();

router.get(
  "/posts",
  asyncHandler(async (_req, res) => {
    const posts = await prisma.post.findMany({
      include: {
        author: { select: { firstName: true, lastName: true } },
        professional: { select: { companyName: true, slug: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json({ posts: posts.map((p) => ({ ...p, images: JSON.parse(p.images) })) });
  })
);

router.delete(
  "/posts/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) throw new ApiError(404, "Publication introuvable.");
    await prisma.post.delete({ where: { id: post.id } });
    await logAdminAction(req.user!.id, "delete_post", "post", post.id);
    res.json({ ok: true });
  })
);

router.get(
  "/reviews",
  asyncHandler(async (_req, res) => {
    const reviews = await prisma.review.findMany({
      include: { client: { select: { firstName: true, lastName: true } }, professional: { select: { companyName: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json({ reviews });
  })
);

router.post(
  "/reviews/:id/report",
  asyncHandler(async (req: AuthedRequest, res) => {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) throw new ApiError(404, "Avis introuvable.");
    const updated = await prisma.review.update({ where: { id: review.id }, data: { reported: true } });
    await logAdminAction(req.user!.id, "flag_review", "review", review.id);
    res.json({ review: updated });
  })
);

router.delete(
  "/reviews/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) throw new ApiError(404, "Avis introuvable.");
    await prisma.review.delete({ where: { id: review.id } });
    await logAdminAction(req.user!.id, "delete_review", "review", review.id);
    res.json({ ok: true });
  })
);

router.get(
  "/reports",
  asyncHandler(async (_req, res) => {
    const reports = await prisma.report.findMany({
      include: { reporter: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ reports });
  })
);

router.post(
  "/reports/:id/resolve",
  asyncHandler(async (req: AuthedRequest, res) => {
    const schema = z.object({ status: z.enum(["reviewed", "dismissed"]) });
    const { status } = schema.parse(req.body);
    const report = await prisma.report.findUnique({ where: { id: req.params.id } });
    if (!report) throw new ApiError(404, "Signalement introuvable.");
    const updated = await prisma.report.update({ where: { id: report.id }, data: { status } });
    await logAdminAction(req.user!.id, `report_${status}`, "report", report.id);
    res.json({ report: updated });
  })
);

export default router;
