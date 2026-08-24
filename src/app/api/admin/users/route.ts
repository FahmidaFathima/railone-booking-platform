import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const users = await prisma.user.findMany({
    include: { _count: { select: { bookings: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}

export async function PATCH(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { userId, action, value } = await request.json();
  if (!userId || !action) {
    return NextResponse.json({ error: "userId and action required" }, { status: 400 });
  }

  if (action === "changeRole") {
    if (!["PASSENGER", "ADMIN"].includes(value)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    await prisma.user.update({ where: { id: userId }, data: { role: value } });
    return NextResponse.json({ message: `Role updated to ${value}` });
  }

  if (action === "toggleActive") {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    await prisma.user.update({ where: { id: userId }, data: { isActive: !user.isActive } });
    return NextResponse.json({ message: user.isActive ? "User suspended" : "User reactivated" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
