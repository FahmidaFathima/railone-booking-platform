"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Ticket, MapPin, Clock, Calendar, CreditCard, XCircle, Download, Eye } from "lucide-react";

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
  seatNumber: string;
  status: string;
  fare: string;
  createdAt: string;
  train: { trainName: string; trainNumber: string; departureTime: string; arrivalTime: string };
  payment?: { status: string; transactionId: string };
}

export default function MyBookingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/bookings")
        .then((r) => r.json())
        .then((data) => { setBookings(Array.isArray(data) ? data : []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status]);

  const statusVariant = (s: string) => {
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: [0.16, 1, 0.3, 1] }}>
          <h1 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            <Ticket size={24} className="text-amber-500" /> My Bookings
          </h1>

          {loading ? (
            <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>
          ) : bookings.length === 0 ? (
            <Card variant="default" className="text-center py-16">
              <CardContent>
                <Ticket size={56} className="text-slate-600 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-slate-300 mb-2">No bookings yet</h2>
                <p className="text-slate-500 mb-6">Start your journey by booking your first ticket.</p>
                <Button onClick={() => router.push("/book-ticket")}>Book a Ticket</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookings.map((b, i) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card variant="elevated" className="hover:border-slate-600/80">
                    <CardContent>
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="font-semibold text-slate-100">{b.train.trainName}</h3>
                            <span className="text-xs text-slate-500 font-mono">#{b.train.trainNumber}</span>
                            <Badge variant={statusVariant(b.status)}>{b.status.replace("_", " ")}</Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1"><MapPin size={14} />{b.source} → {b.destination}</span>
                            <span className="flex items-center gap-1"><Calendar size={14} />{new Date(b.journeyDate).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1"><Clock size={14} />{b.train.departureTime}</span>
                            <span>{b.classBooked} · {b.seatNumber || "TBD"}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className="font-mono font-semibold text-amber-400 text-lg">{b.pnr}</p>
                          <p className="text-sm text-slate-400">₹{b.fare}</p>
                          <div className="flex gap-2">
                            {b.status === "PENDING_PAYMENT" && (
                              <Button size="sm" onClick={() => router.push(`/payment/${b.id}`)}>
                                <CreditCard size={14} className="mr-1" /> Pay
                              </Button>
                            )}
                            {b.status === "CONFIRMED" && (
                              <Button size="sm" variant="secondary" onClick={() => router.push(`/payment/${b.id}`)}>
                                <Eye size={14} className="mr-1" /> View Ticket
                              </Button>
                            )}
                            {(b.status === "CONFIRMED" || b.status === "PENDING_PAYMENT") && (
                              <Button size="sm" variant="ghost" onClick={() => router.push("/cancellation")}>
                                <XCircle size={14} className="mr-1" /> Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
