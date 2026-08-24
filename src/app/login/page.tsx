"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loginSchema, LoginInput } from "@/lib/validators";

const LoginScene = dynamic(() => import("@/components/3d/LoginScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-b from-[#0B1120] to-[#1E293B]" />
  ),
});

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(result.error);
    } else {
      // Check role from session to redirect appropriately
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();
      const role = sessionData?.user?.role;
      router.push(role === "ADMIN" ? "/admin" : "/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0B1120] overflow-hidden">
      {/* 3D Scene - Left side */}
      <div className="hidden lg:block lg:w-[60%] relative">
        <LoginScene />
        {/* Gradient overlay for blending */}
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#0B1120] to-transparent" />
      </div>

      {/* Login Form - Right side */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-6 lg:p-12 relative">
        {/* Mobile background fallback */}
        <div className="absolute inset-0 lg:hidden bg-gradient-to-b from-[#0B1120] via-[#1E293B] to-[#0B1120]" />

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.8 }}
          className="relative w-full max-w-md"
        >
          {/* Glass card */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-amber-500/10 rounded-2xl p-8 shadow-2xl shadow-amber-500/5">
            {/* Logo */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight font-[var(--font-heading)]">
                Rail<span className="text-amber-500">One</span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">Your journey, reimagined.</p>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                id="email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                icon={<Mail size={18} />}
                error={errors.email?.message}
                {...register("email")}
              />

              <Input
                id="password"
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={18} />}
                error={errors.password?.message}
                {...register("password")}
              />

              <div className="flex items-center">
                <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500/50"
                  />
                  Remember me
                </label>
              </div>

              <Button
                type="submit"
                size="lg"
                loading={loading}
                className="w-full group"
              >
                Sign In
                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-700" />
              <span className="text-xs text-slate-500 uppercase">or</span>
              <div className="flex-1 h-px bg-slate-700" />
            </div>

            {/* Google Sign-In */}
            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="w-full flex items-center justify-center gap-3 px-5 py-2.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 hover:border-slate-600 transition-all text-sm font-medium text-slate-200"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Register + Forgot password links */}
            <div className="mt-5 text-center space-y-2">
              <p className="text-sm text-slate-400">
                New here?{" "}
                <Link href="/register" className="text-amber-500 hover:text-amber-400 font-medium transition-colors">
                  Create an account
                </Link>
              </p>
              <p>
                <Link href="/forgot-password" className="text-xs text-slate-500 hover:text-slate-400 transition-colors">
                  Forgot password?
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
