import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler, ApiError } from "../../middleware/error";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ messages });
  })
);

router.post(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const message = await prisma.contactMessage.findUnique({ where: { id: req.params.id } });
    if (!message) throw new ApiError(404, "Message introuvable.");
    const updated = await prisma.contactMessage.update({ where: { id: message.id }, data: { status: "read" } });
    res.json({ message: updated });
  })
);

export default router;
