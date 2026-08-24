"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Train,
  Ticket,
  CreditCard,
  XCircle,
  Search,
  LogOut,
  User,
  Users,
  Menu,
  X,
  Shield,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const passengerLinks = [
  { href: "/book-ticket", label: "Book Ticket", icon: Ticket },
  { href: "/my-bookings", label: "My Bookings", icon: Ticket },
  { href: "/pnr-enquiry", label: "PNR Enquiry", icon: Search },
  { href: "/track-train", label: "Track Train", icon: Train },
  { href: "/cancellation", label: "Cancellation", icon: XCircle },
];

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/trains", label: "Trains", icon: Train },
  { href: "/admin/bookings", label: "Bookings", icon: Ticket },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";
  const navLinks = isAdmin ? adminLinks : passengerLinks;
  const homeHref = isAdmin ? "/admin" : "/dashboard";

  return (
    <nav className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Admin badge */}
          <Link href={homeHref} className="flex items-center gap-2">
            <Train size={24} className="text-amber-500" />
            <span className="text-xl font-bold text-slate-100 tracking-tight">
              Rail<span className="text-amber-500">One</span>
            </span>
            {isAdmin && (
              <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Admin
              </span>
            )}
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  )}
                >
                  <Icon size={16} />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  isAdmin
                    ? "bg-gradient-to-br from-amber-500 to-red-500"
                    : "bg-gradient-to-br from-amber-500 to-amber-600"
                )}>
                  {isAdmin ? <Shield size={14} className="text-white" /> : <User size={14} className="text-slate-900" />}
                </div>
                <span className="hidden sm:block">{session?.user?.name || "User"}</span>
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl p-1.5 shadow-xl"
                  >
                    <Link
                      href={homeHref}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <LayoutDashboard size={16} />
                      {isAdmin ? "Admin Dashboard" : "My Dashboard"}
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-slate-700 transition-colors w-full text-left"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-slate-200"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-800"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-amber-500/10 text-amber-400"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    )}
                  >
                    <Icon size={18} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
