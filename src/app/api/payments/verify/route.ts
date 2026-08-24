import crypto from "crypto";
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

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
      return NextResponse.json(
        { error: "Missing required payment verification fields" },
        { status: 400 }
      );
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { verified: false, error: "Payment verification failed — signature mismatch" },
        { status: 400 }
      );
    }

    // Signature verified — update records
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
      // Already paid — idempotent
      return NextResponse.json({ verified: true, message: "Payment already confirmed" });
    }

    // Create or update Payment record
    if (booking.payment) {
      await prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: "SUCCESS",
          transactionId: razorpay_payment_id,
          paidAt: new Date(),
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: booking.fare,
          status: "SUCCESS",
          transactionId: razorpay_payment_id,
          paidAt: new Date(),
        },
      });
    }

    // Update Booking status to CONFIRMED
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED" },
    });

    return NextResponse.json({ verified: true, message: "Payment verified and booking confirmed" });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { verified: false, error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
