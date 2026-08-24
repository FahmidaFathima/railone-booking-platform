import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const bookings = await prisma.booking.findMany({
    include: {
      user: { select: { name: true, email: true } },
      train: { select: { trainName: true, trainNumber: true } },
      payment: true,
      cancellation: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(bookings);
}

export async function PATCH(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { bookingId, status } = await request.json();
  if (!bookingId || !status) {
    return NextResponse.json({ error: "bookingId and status required" }, { status: 400 });
  }

  if (!["PENDING_PAYMENT", "CONFIRMED", "CANCELLED", "WAITLISTED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await prisma.booking.update({ where: { id: bookingId }, data: { status } });
  return NextResponse.json({ message: `Booking status updated to ${status}` });
}
