import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source");
    const destination = searchParams.get("destination");

    const where: Record<string, unknown> = { isActive: true };
    if (source) where.source = source;
    if (destination) where.destination = destination;

    const trains = await prisma.train.findMany({
      where,
      include: {
        classes: true,
      },
      orderBy: { departureTime: "asc" },
    });

    return NextResponse.json(trains);
  } catch (error) {
    console.error("Trains fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trains" },
      { status: 500 }
    );
  }
}
