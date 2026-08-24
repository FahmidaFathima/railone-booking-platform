import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const trains = await prisma.train.findMany({
    include: { classes: true, _count: { select: { bookings: true } } },
    orderBy: { trainNumber: "asc" },
  });
  return NextResponse.json(trains);
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { trainNumber, trainName, source, destination, departureTime, arrivalTime, duration, totalSeats, fare, classes } = body;

  if (!trainNumber || !trainName || !source || !destination) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  const existing = await prisma.train.findUnique({ where: { trainNumber } });
  if (existing) {
    return NextResponse.json({ error: "Train number already exists" }, { status: 409 });
  }

  const train = await prisma.train.create({
    data: {
      trainNumber, trainName, source, destination,
      departureTime: departureTime || "00:00",
      arrivalTime: arrivalTime || "00:00",
      duration: duration || "0h",
      totalSeats: totalSeats || 500,
      fare: fare || 500,
      classes: {
        create: (classes || []).map((c: { className: string; fareMultiplier: number; seatsAvailable: number }) => ({
          className: c.className,
          fareMultiplier: c.fareMultiplier || 1.0,
          seatsAvailable: c.seatsAvailable || 100,
        })),
      },
    },
    include: { classes: true },
  });

  return NextResponse.json(train, { status: 201 });
}

export async function PATCH(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { id, ...data } = body;

  if (!id) return NextResponse.json({ error: "Train id required" }, { status: 400 });

  // Handle classes separately if provided
  const { classes, ...trainData } = data;

  const train = await prisma.train.update({
    where: { id },
    data: trainData,
    include: { classes: true },
  });

  // If classes are provided, replace them
  if (classes && Array.isArray(classes)) {
    await prisma.trainClass.deleteMany({ where: { trainId: id } });
    await prisma.trainClass.createMany({
      data: classes.map((c: { className: string; fareMultiplier: number; seatsAvailable: number }) => ({
        trainId: id,
        className: c.className,
        fareMultiplier: c.fareMultiplier || 1.0,
        seatsAvailable: c.seatsAvailable || 100,
      })),
    });
  }

  return NextResponse.json(train);
}

export async function DELETE(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Train id required" }, { status: 400 });

  // Soft-delete: set isActive to false (preserves booking references)
  const train = await prisma.train.findUnique({ where: { id }, include: { _count: { select: { bookings: true } } } });
  if (!train) return NextResponse.json({ error: "Train not found" }, { status: 404 });

  await prisma.train.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ message: "Train deactivated", hadBookings: train._count.bookings > 0 });
}
