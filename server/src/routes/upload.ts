import { Router } from "express";
import { upload, fileUrl } from "../lib/upload";
import { requireAuth } from "../middleware/auth";
import { ApiError } from "../middleware/error";

const router = Router();

router.post("/", requireAuth, upload.single("file"), (req, res) => {
  if (!req.file) throw new ApiError(400, "Aucun fichier reçu.");
  res.status(201).json({ url: fileUrl(req.file.filename) });
});

export default router;
