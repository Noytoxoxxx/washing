import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { UPLOAD_DIR, MAX_UPLOAD_SIZE_MB, ALLOWED_IMAGE_TYPES } from "../config";

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = crypto.randomBytes(16).toString("hex");
    cb(null, `${name}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(new Error("Type de fichier non autorisé. Formats acceptés : JPEG, PNG, WEBP, GIF."));
      return;
    }
    cb(null, true);
  },
});

export function fileUrl(filename: string): string {
  return `/uploads/${filename}`;
}
