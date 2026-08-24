import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler, ApiError } from "../middleware/error";
import { attachUser, requireAuth, requireRole, AuthedRequest } from "../middleware/auth";
import { notify } from "../lib/notify";

const router = Router();

async function decoratePosts(posts: any[], userId?: string) {
  const postIds = posts.map((p) => p.id);
  const [likes, saves] = userId
    ? await Promise.all([
        prisma.like.findMany({ where: { userId, postId: { in: postIds } } }),
        prisma.postSave.findMany({ where: { userId, postId: { in: postIds } } }),
      ])
    : [[], []];
  const likedSet = new Set(likes.map((l) => l.postId));
  const savedSet = new Set(saves.map((s) => s.postId));
  return posts.map((p) => ({
    ...p,
    images: JSON.parse(p.images),
    likeCount: p._count?.likes ?? p.likes?.length ?? 0,
    commentCount: p._count?.comments ?? p.comments?.length ?? 0,
    isLiked: likedSet.has(p.id),
    isSaved: savedSet.has(p.id),
  }));
}

router.get(
  "/",
  attachUser,
  asyncHandler(async (req: AuthedRequest, res) => {
    const page = Number(req.query.page || 1);
    const limit = Math.min(Number(req.query.limit || 12), 30);
    const following = req.query.following === "true";
    const professionalId = req.query.professionalId as string | undefined;

    let professionalFilter: string[] | undefined;
    if (following) {
      if (!req.user) throw new ApiError(401, "Non authentifié.");
      const follows = await prisma.follow.findMany({ where: { userId: req.user.id } });
      professionalFilter = follows.map((f) => f.professionalId);
    }

    const posts = await prisma.post.findMany({
      where: {
        ...(professionalId ? { professionalId } : {}),
        ...(professionalFilter ? { professionalId: { in: professionalFilter } } : {}),
      },
      include: {
        author: { select: { firstName: true, lastName: true, avatarUrl: true } },
        professional: { select: { companyName: true, slug: true, logoUrl: true, verified: true, isFounder: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.post.count({
      where: {
        ...(professionalId ? { professionalId } : {}),
        ...(professionalFilter ? { professionalId: { in: professionalFilter } } : {}),
      },
    });

    res.json({ posts: await decoratePosts(posts, req.user?.id), total, page, totalPages: Math.ceil(total / limit) });
  })
);

const createSchema = z.object({
  images: z.array(z.string()).min(1, "Ajoutez au moins une image."),
  description: z.string().max(2000).optional(),
  vehicleTag: z.string().optional(),
  serviceTag: z.string().optional(),
  hashtags: z.string().optional(),
  isBeforeAfter: z.boolean().optional(),
});

router.post(
  "/",
  requireAuth,
  requireRole("PROFESSIONAL"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = createSchema.parse(req.body);
    const profile = await prisma.professionalProfile.findUnique({ where: { userId: req.user!.id } });
    if (!profile) throw new ApiError(404, "Profil professionnel introuvable.");

    const post = await prisma.post.create({
      data: {
        authorUserId: req.user!.id,
        professionalId: profile.id,
        images: JSON.stringify(data.images),
        description: data.description ?? "",
        vehicleTag: data.vehicleTag,
        serviceTag: data.serviceTag,
        hashtags: data.hashtags ?? "",
        isBeforeAfter: data.isBeforeAfter ?? false,
      },
    });

    const followers = await prisma.follow.findMany({ where: { professionalId: profile.id } });
    await Promise.all(
      followers.map((f) => notify(f.userId, "post", "Nouvelle publication", `${profile.companyName} a publié une nouvelle photo.`, `/decouvrir`))
    );

    res.status(201).json({ post: { ...post, images: data.images, likeCount: 0, commentCount: 0, isLiked: false, isSaved: false } });
  })
);

router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) throw new ApiError(404, "Publication introuvable.");
    if (post.authorUserId !== req.user!.id && req.user!.role !== "ADMIN") throw new ApiError(403, "Accès refusé.");
    await prisma.post.delete({ where: { id: post.id } });
    res.json({ ok: true });
  })
);

router.post(
  "/:id/like",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const postId = req.params.id;
    const existing = await prisma.like.findUnique({ where: { postId_userId: { postId, userId: req.user!.id } } });
    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      return res.json({ liked: false });
    }
    await prisma.like.create({ data: { postId, userId: req.user!.id } });
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (post && post.authorUserId !== req.user!.id) {
      await notify(post.authorUserId, "like", "Nouveau like", "Quelqu'un a aimé votre publication.", "/pro/publications");
    }
    res.json({ liked: true });
  })
);

router.post(
  "/:id/save",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const postId = req.params.id;
    const existing = await prisma.postSave.findUnique({ where: { postId_userId: { postId, userId: req.user!.id } } });
    if (existing) {
      await prisma.postSave.delete({ where: { id: existing.id } });
      return res.json({ saved: false });
    }
    await prisma.postSave.create({ data: { postId, userId: req.user!.id } });
    res.json({ saved: true });
  })
);

router.get(
  "/:id/comments",
  asyncHandler(async (req, res) => {
    const comments = await prisma.comment.findMany({
      where: { postId: req.params.id },
      include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" },
    });
    res.json({ comments });
  })
);

router.post(
  "/:id/comments",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const schema = z.object({ text: z.string().min(1, "Le commentaire ne peut pas être vide.").max(1000) });
    const data = schema.parse(req.body);
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) throw new ApiError(404, "Publication introuvable.");
    const comment = await prisma.comment.create({
      data: { postId: post.id, userId: req.user!.id, text: data.text },
      include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
    });
    if (post.authorUserId !== req.user!.id) {
      await notify(post.authorUserId, "comment", "Nouveau commentaire", "Quelqu'un a commenté votre publication.", "/pro/publications");
    }
    res.status(201).json({ comment });
  })
);

router.delete(
  "/comments/:id",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
    if (!comment) throw new ApiError(404, "Commentaire introuvable.");
    if (comment.userId !== req.user!.id && req.user!.role !== "ADMIN") throw new ApiError(403, "Accès refusé.");
    await prisma.comment.delete({ where: { id: comment.id } });
    res.json({ ok: true });
  })
);

router.post(
  "/:id/report",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) throw new ApiError(404, "Publication introuvable.");
    await prisma.report.create({
      data: { targetType: "post", targetId: post.id, reporterId: req.user!.id, reason: req.body?.reason || "Signalement utilisateur" },
    });
    res.json({ ok: true });
  })
);

export default router;
