import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail, generateOtp } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal whether email exists — always return success
      return NextResponse.json({ message: "If an account exists, an OTP has been sent." });
    }

    // Generate OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate any existing OTPs for this email
    await prisma.otp.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    // Store OTP
    await prisma.otp.create({
      data: { email, code: otp, expiresAt },
    });

    // Send email
    const sent = await sendOtpEmail(email, otp);
    if (!sent) {
      return NextResponse.json({ error: "Failed to send OTP email. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ message: "OTP sent to your email." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
