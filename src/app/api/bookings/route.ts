import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { passengerSchema } from "@/lib/validators";
import { encryptAadhar } from "@/lib/encryption";
import { generateUniquePnr } from "@/lib/pnr";
import { z } from "zod";

const bookingRequestSchema = passengerSchema.extend({
  trainId: z.string().min(1),
  classBooked: z.string().min(1),
  source: z.string().min(1),
  destination: z.string().min(1),
  journeyDate: z.string().min(1),
  fare: z.number().positive(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        train: true,
        payment: true,
        cancellation: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Bookings fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await request.json();
    const validation = bookingRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Encrypt Aadhar number
    const encryptedAadhar = encryptAadhar(data.aadharNumber);

    // Generate unique PNR
    const pnr = await generateUniquePnr();

    // Generate seat number
    const seatNumber = `${data.classBooked.charAt(0)}${Math.floor(Math.random() * 72) + 1}`;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        pnr,
        userId,
        trainId: data.trainId,
        passengerName: data.passengerName,
        gender: data.gender,
        age: data.age,
        aadharNumber: encryptedAadhar,
        address: data.address,
        phone: data.phone,
        source: data.source,
        destination: data.destination,
        journeyDate: new Date(data.journeyDate),
        classBooked: data.classBooked,
        seatNumber,
        fare: data.fare,
        status: "PENDING_PAYMENT",
      },
      include: { train: true },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
