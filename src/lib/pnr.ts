import { prisma } from "./prisma";

export async function generateUniquePnr(): Promise<string> {
  let pnr: string;
  let exists = true;

  do {
    // Generate a 10-digit numeric PNR
    pnr = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const existing = await prisma.booking.findUnique({ where: { pnr } });
    exists = !!existing;
  } while (exists);

  return pnr;
}

export function calculateRefund(journeyDate: Date, fare: number): { refundPercent: number; refundAmount: number } {
  const now = new Date();
  const hoursUntilJourney = (journeyDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilJourney > 48) {
    return { refundPercent: 90, refundAmount: Math.round(fare * 0.9) };
  } else if (hoursUntilJourney > 24) {
    return { refundPercent: 50, refundAmount: Math.round(fare * 0.5) };
  } else {
    return { refundPercent: 0, refundAmount: 0 };
  }
}
