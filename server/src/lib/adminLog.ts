import { prisma } from "./prisma";

export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId?: string,
  meta?: Record<string, unknown>
) {
  await prisma.adminLog.create({
    data: {
      adminId,
      action,
      targetType,
      targetId,
      meta: meta ? JSON.stringify(meta) : null,
    },
  });
}
