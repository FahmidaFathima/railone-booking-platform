"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Ticket, CreditCard, MapPin, Clock, ArrowRight, Search } from "lucide-react";
import Link from "next/link";

import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Booking {
  id: string;
  pnr: string;
  passengerName: string;
  source: string;
  destination: string;
  journeyDate: string;
  classBooked: string;
  status: string;
  fare: string;
  train: {
    trainName: string;
    trainNumber: string;
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    // Redirect admins to their dashboard
    if (status === "authenticated") {
      const role = (session?.user as { role?: string })?.role;
      if (role === "ADMIN") {
        router.push("/admin");
        return;
      }
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/bookings")
        .then((r) => r.json())
        .then((data) => {
          setBookings(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0B1120]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-48 w-full mb-6" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  const statusBadgeVariant = (s: string) => {
    switch (s) {
      case "CONFIRMED": return "success";
      case "PENDING_PAYMENT": return "warning";
      case "CANCELLED": return "danger";
      case "WAITLISTED": return "info";
      default: return "default";
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero / Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.6 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
              Welcome back, <span className="text-amber-400">{session?.user?.name}</span>
            </h1>
            <p className="text-slate-400 mt-1">Ready for your next journey?</p>
          </div>

          {/* Quick action cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <Link href="/book-ticket">
              <Card variant="elevated" className="hover:border-amber-500/30 cursor-pointer group">
                <CardContent className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                    <Ticket size={24} className="text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-100">Book Ticket</h3>
                    <p className="text-sm text-slate-400">Search & reserve seats</p>
                  </div>
                  <ArrowRight size={18} className="ml-auto text-slate-600 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/pnr-enquiry">
              <Card variant="elevated" className="hover:border-amber-500/30 cursor-pointer group">
                <CardContent className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                    <Search size={24} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-100">PNR Enquiry</h3>
                    <p className="text-sm text-slate-400">Track your booking</p>
                  </div>
                  <ArrowRight size={18} className="ml-auto text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/cancellation">
              <Card variant="elevated" className="hover:border-amber-500/30 cursor-pointer group">
                <CardContent className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                    <CreditCard size={24} className="text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-100">Cancel Ticket</h3>
                    <p className="text-sm text-slate-400">Request cancellation</p>
                  </div>
                  <ArrowRight size={18} className="ml-auto text-slate-600 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </motion.div>

        {/* Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-slate-100 mb-4">My Bookings</h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <Card variant="default" className="text-center py-12">
              <CardContent>
                <Ticket size={48} className="text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">No bookings yet. Start your journey!</p>
                <Link href="/book-ticket">
                  <Button>Book Your First Ticket</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <Card key={booking.id} variant="elevated" className="hover:border-slate-600/80">
                  <CardContent>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-slate-100">
                            {booking.train.trainName}
                          </h3>
                          <Badge variant={statusBadgeVariant(booking.status)}>
                            {booking.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {booking.source} → {booking.destination}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {new Date(booking.journeyDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-400">PNR</p>
                        <p className="font-mono font-semibold text-amber-400">{booking.pnr}</p>
                        <p className="text-sm text-slate-400 mt-1">₹{booking.fare}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
