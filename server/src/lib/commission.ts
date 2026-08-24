import { prisma } from "./prisma";

// Resolves the commission rate to apply RIGHT NOW for a professional. Per spec §89, this rate
// must be snapshotted onto the Transaction at creation time and never recalculated later —
// admin changes to plan rates only affect future transactions.
export async function resolveCommissionRate(professionalId: string): Promise<number> {
  const professional = await prisma.professionalProfile.findUniqueOrThrow({
    where: { id: professionalId },
  });
  if (professional.commissionOverride != null) return professional.commissionOverride;

  const setting = await prisma.commissionSetting.findUnique({
    where: { plan: professional.subscriptionPlan },
  });
  return setting?.ratePercent ?? 0;
}

export async function createTransactionForBooking(bookingId: string) {
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } });
  const rate = await resolveCommissionRate(booking.professionalId);
  const commissionAmount = Math.round(booking.price * (rate / 100) * 100) / 100;
  const netAmount = Math.round((booking.price - commissionAmount) * 100) / 100;

  return prisma.transaction.create({
    data: {
      bookingId,
      professionalId: booking.professionalId,
      grossAmount: booking.price,
      commissionRateApplied: rate,
      commissionAmount,
      netAmount,
      status: "payment_pending",
    },
  });
}
