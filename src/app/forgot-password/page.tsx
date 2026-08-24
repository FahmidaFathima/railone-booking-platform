"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, KeyRound, Check } from "lucide-react";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Step = "email" | "otp" | "reset" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email) { toast.error("Enter your email"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("OTP sent to your email. Check your inbox.");
        setStep("otp");
      } else {
        toast.error(data.error || "Failed to send OTP");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { toast.error("Enter the 6-digit OTP"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok && data.verified) {
        toast.success("OTP verified! Set your new password.");
        setStep("reset");
      } else {
        toast.error(data.error || "Invalid OTP");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Password reset successfully!");
        setStep("done");
      } else {
        toast.error(data.error || "Failed to reset password");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0B1120] via-[#1E293B] to-[#0B1120] p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.8 }}
        className="w-full max-w-md"
      >
        <div className="bg-slate-900/40 backdrop-blur-xl border border-amber-500/10 rounded-2xl p-8 shadow-2xl shadow-amber-500/5">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Rail<span className="text-amber-500">One</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {step === "email" && "Enter your email to receive a reset code."}
              {step === "otp" && "Enter the 6-digit code sent to your email."}
              {step === "reset" && "Set your new password."}
              {step === "done" && "You're all set!"}
            </p>
          </div>

          {/* Step 1: Enter email */}
          {step === "email" && (
            <div className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                icon={<Mail size={18} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
              />
              <Button onClick={handleSendOtp} loading={loading} size="lg" className="w-full">
                Send OTP <ArrowRight size={18} className="ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Enter OTP */}
          {step === "otp" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Code sent to <span className="text-amber-400">{email}</span>
              </p>
              <Input
                label="6-Digit OTP"
                placeholder="000000"
                icon={<KeyRound size={18} />}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                className="text-center text-xl tracking-[0.5em] font-mono"
                maxLength={6}
              />
              <Button onClick={handleVerifyOtp} loading={loading} size="lg" className="w-full">
                Verify OTP <ArrowRight size={18} className="ml-2" />
              </Button>
              <button
                onClick={() => { setStep("email"); setOtp(""); }}
                className="text-sm text-slate-500 hover:text-slate-400 w-full text-center"
              >
                Didn&apos;t receive it? Go back
              </button>
            </div>
          )}

          {/* Step 3: Set new password */}
          {step === "reset" && (
            <div className="space-y-4">
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={18} />}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={18} />}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
              />
              <Button onClick={handleResetPassword} loading={loading} size="lg" className="w-full">
                Reset Password <ArrowRight size={18} className="ml-2" />
              </Button>
            </div>
          )}

          {/* Done */}
          {step === "done" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto">
                <Check size={32} className="text-emerald-400" />
              </div>
              <p className="text-slate-300">Your password has been reset. You can now sign in.</p>
              <Button onClick={() => router.push("/login")} size="lg" className="w-full">
                Go to Login
              </Button>
            </div>
          )}

          {/* Back to login */}
          {step !== "done" && (
            <p className="mt-6 text-center text-sm text-slate-400">
              Remember your password?{" "}
              <Link href="/login" className="text-amber-500 hover:text-amber-400 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
