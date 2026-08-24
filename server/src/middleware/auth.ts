import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";
import { COOKIE_NAME } from "../config";
import { prisma } from "../lib/prisma";

export interface AuthedRequest extends Request {
  user?: { id: string; role: string; status: string };
}

export async function attachUser(req: AuthedRequest, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return next();
  const payload = verifyToken(token);
  if (!payload) return next();
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (user && user.status === "active") {
    req.user = { id: user.id, role: user.role, status: user.status };
  }
  next();
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Non authentifié." });
  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Non authentifié." });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Accès refusé." });
    next();
  };
}
