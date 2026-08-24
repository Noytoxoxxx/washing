import { prisma } from "./prisma";

export async function notify(userId: string, type: string, title: string, message: string, link?: string) {
  await prisma.notification.create({
    data: { userId, type, title, message, link },
  });
}
