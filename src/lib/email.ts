import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendOtpEmail(to: string, otp: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"RailOne" <${process.env.SMTP_USER}>`,
      to,
      subject: "RailOne — Password Reset OTP",
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e293b; margin-bottom: 16px;">Password Reset</h2>
          <p style="color: #475569;">Your one-time verification code is:</p>
          <div style="background: #0f172a; border-radius: 8px; padding: 20px; text-align: center; margin: 16px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #f59e0b;">${otp}</span>
          </div>
          <p style="color: #475569; font-size: 14px;">This code expires in <strong>10 minutes</strong>.</p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 11px;">RailOne — Your journey, reimagined.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
