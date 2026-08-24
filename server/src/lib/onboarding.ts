import { prisma } from "./prisma";

// Weighted onboarding completion per spec §94.
export async function recomputeProfileCompletion(professionalId: string): Promise<number> {
  const p = await prisma.professionalProfile.findUniqueOrThrow({
    where: { id: professionalId },
    include: { services: true, galleryImages: true, businessHours: true },
  });

  let pct = 0;
  if (p.companyName) pct += 10;
  if (p.description && p.description.length > 20) pct += 10;
  if (p.logoUrl) pct += 10;
  if (p.coverUrl) pct += 10;
  if (p.services.length > 0) pct += 20;
  if (p.galleryImages.length > 0) pct += 20;
  if (p.businessHours.length > 0) pct += 10;
  if (p.instagram || p.tiktok || p.website) pct += 10;

  await prisma.professionalProfile.update({
    where: { id: professionalId },
    data: { profileCompletion: pct },
  });
  return pct;
}
