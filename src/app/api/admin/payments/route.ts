import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const payments = await prisma.payment.findMany({
    include: {
      booking: {
        include: {
          user: { select: { name: true, email: true } },
          train: { select: { trainName: true, trainNumber: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Summary stats
  const allPayments = await prisma.payment.findMany();
  const totalRevenue = allPayments
    .filter(p => p.status === "SUCCESS")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayRevenue = allPayments
    .filter(p => p.status === "SUCCESS" && p.paidAt && new Date(p.paidAt) >= today)
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingCount = allPayments.filter(p => p.status === "PENDING").length;
  const refundedCount = allPayments.filter(p => p.status === "REFUNDED").length;

  return NextResponse.json({
    payments,
    stats: { totalRevenue, todayRevenue, pendingCount, refundedCount },
  });
}

export async function PATCH(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { paymentId, status } = await request.json();
  if (!paymentId || !status) {
    return NextResponse.json({ error: "paymentId and status required" }, { status: 400 });
  }

  await prisma.payment.update({ where: { id: paymentId }, data: { status } });
  return NextResponse.json({ message: "Payment status updated" });
}
