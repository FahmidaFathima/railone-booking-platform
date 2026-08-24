import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    // Verify the booking belongs to the user
    const userId = (session.user as { id: string }).id;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (booking.payment?.status === "SUCCESS") {
      return NextResponse.json({ error: "Payment already completed" }, { status: 400 });
    }

    // Simulate payment processing
    const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Create payment record and update booking status
    const payment = await prisma.payment.create({
      data: {
        bookingId,
        amount: booking.fare,
        status: "SUCCESS",
        transactionId,
        paidAt: new Date(),
      },
    });

    // Update booking status to CONFIRMED
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED" },
    });

    return NextResponse.json({
      payment,
      message: "Payment successful! Your ticket is confirmed.",
    });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Payment processing failed" }, { status: 500 });
  }
}
