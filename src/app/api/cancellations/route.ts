import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateRefund } from "@/lib/pnr";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pnr, reason } = await request.json();

    if (!pnr || !reason) {
      return NextResponse.json({ error: "PNR and reason are required" }, { status: 400 });
    }

    const userId = (session.user as { id: string }).id;

    // Find booking by PNR
    const booking = await prisma.booking.findUnique({
      where: { pnr },
      include: { cancellation: true, train: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "No booking found with this PNR" }, { status: 404 });
    }

    if (booking.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json({ error: "This booking is already cancelled" }, { status: 400 });
    }

    // Calculate refund
    const { refundAmount } = calculateRefund(booking.journeyDate, Number(booking.fare));

    // Create cancellation and update booking status
    const cancellation = await prisma.cancellation.create({
      data: {
        bookingId: booking.id,
        reason,
        refundAmount,
        refundStatus: refundAmount > 0 ? "SUCCESS" : "PENDING",
      },
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({
      cancellation,
      refundAmount,
      message: refundAmount > 0
        ? `Cancellation successful. Refund of ₹${refundAmount} will be processed.`
        : "Cancellation successful. No refund applicable for cancellations within 24 hours of journey.",
    });
  } catch (error) {
    console.error("Cancellation error:", error);
    return NextResponse.json({ error: "Cancellation failed" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pnr = searchParams.get("pnr");

    if (!pnr) {
      return NextResponse.json({ error: "PNR is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { pnr },
      include: {
        train: true,
        payment: true,
        cancellation: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "No booking found with this PNR" }, { status: 404 });
    }

    // Don't expose raw Aadhar
    const { aadharNumber, ...safeBooking } = booking;
    return NextResponse.json({
      ...safeBooking,
      aadharMasked: "XXXX-XXXX-" + "****", // Never expose from enquiry
    });
  } catch (error) {
    console.error("PNR enquiry error:", error);
    return NextResponse.json({ error: "Enquiry failed" }, { status: 500 });
  }
}
