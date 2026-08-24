import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [totalUsers, totalBookings, totalTrains, payments, recentBookings] = await Promise.all([
    prisma.user.count(),
    prisma.booking.count(),
    prisma.train.count({ where: { isActive: true } }),
    prisma.payment.findMany({ where: { status: "SUCCESS" } }),
    prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        train: { select: { trainName: true } },
      },
    }),
  ]);

  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return NextResponse.json({
    totalUsers,
    totalBookings,
    totalTrains,
    totalRevenue,
    recentBookings,
  });
}
