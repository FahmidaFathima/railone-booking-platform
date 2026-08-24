"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CreditCard, Check, Train, MapPin, Calendar, Download } from "lucide-react";

import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface BookingDetails {
  id: string;
  pnr: string;
  passengerName: string;
  source: string;
  destination: string;
  journeyDate: string;
  classBooked: string;
  seatNumber: string;
  fare: string;
  status: string;
  train: {
    trainName: string;
    trainNumber: string;
    departureTime: string;
    arrivalTime: string;
  };
  payment?: {
    status: string;
    transactionId: string;
  };
}

export default function PaymentPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && bookingId) {
      fetch("/api/bookings")
        .then((r) => r.json())
        .then((data) => {
          const found = Array.isArray(data) ? data.find((b: BookingDetails) => b.id === bookingId) : null;
          setBooking(found || null);
          if (found?.payment?.status === "SUCCESS") setPaid(true);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, bookingId]);

  const handlePayment = async () => {
    if (!booking) return;
    setPaying(true);

    try {
      // Step 1: Create Razorpay order (amount validated server-side)
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        toast.error(err.error || "Failed to create payment order");
        setPaying(false);
        return;
      }

      const order = await orderRes.json();

      // Step 2: Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "RailOne",
        description: `PNR ${booking.pnr}`,
        order_id: order.id,
        handler: async function (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
          // Step 3: Verify payment signature server-side
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...response, bookingId }),
            });

            const result = await verifyRes.json();
            if (result.verified) {
              setPaid(true);
              toast.success("Payment successful! Your ticket is confirmed.");
            } else {
              toast.error(result.error || "Payment verification failed. Please contact support.");
            }
          } catch {
            toast.error("Payment verification failed. Please try again.");
          }
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
            toast.error("Payment cancelled.");
          },
        },
        prefill: {
          name: booking.passengerName,
        },
        theme: { color: "#F59E0B" },
      };

      const rzp = new (window as unknown as { Razorpay: new (opts: typeof options) => { open: () => void } }).Razorpay(options);
      rzp.open();
    } catch {
      toast.error("Payment processing failed. Please try again.");
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#0B1120]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-slate-400">Booking not found.</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-4">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {paid ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
          >
            {/* Success State */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-4"
              >
                <Check size={40} className="text-emerald-400" />
              </motion.div>
              <h1 className="text-3xl font-bold text-slate-100">Payment Successful!</h1>
              <p className="text-slate-400 mt-2">Your ticket has been confirmed</p>
            </div>

            {/* Ticket Card */}
            <Card variant="glass" className="overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 p-6 border-b border-amber-500/10">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-amber-400 font-medium">E-TICKET</p>
                    <h2 className="text-xl font-bold text-slate-100">{booking.train.trainName}</h2>
                    <p className="text-sm text-slate-400">#{booking.train.trainNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">PNR</p>
                    <p className="text-xl font-mono font-bold text-amber-400">{booking.pnr}</p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Passenger</p>
                    <p className="text-slate-200 font-medium">{booking.passengerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Seat</p>
                    <p className="text-slate-200 font-medium">{booking.seatNumber} ({booking.classBooked})</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">From</p>
                    <p className="text-slate-200 font-medium">{booking.source}</p>
                    <p className="text-xs text-slate-400">{booking.train.departureTime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">To</p>
                    <p className="text-slate-200 font-medium">{booking.destination}</p>
                    <p className="text-xs text-slate-400">{booking.train.arrivalTime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Date</p>
                    <p className="text-slate-200 font-medium">{new Date(booking.journeyDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Amount Paid</p>
                    <p className="text-amber-400 font-bold text-lg">₹{booking.fare}</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-700 flex flex-col sm:flex-row gap-3">
                  <Button onClick={() => router.push("/dashboard")} variant="secondary" className="flex-1">
                    Go to My Bookings
                  </Button>
                  <Button onClick={() => router.push("/book-ticket")} className="flex-1">
                    Book Another Ticket
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
              <CreditCard size={24} className="text-amber-500" />
              Payment
            </h1>

            <Card variant="glass">
              <CardContent>
                {/* Order Summary */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-400 uppercase mb-3">Order Summary</h3>
                  <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Train</span>
                      <span className="text-slate-200">{booking.train.trainName} (#{booking.train.trainNumber})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Route</span>
                      <span className="text-slate-200">{booking.source} → {booking.destination}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Date</span>
                      <span className="text-slate-200">{new Date(booking.journeyDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Class</span>
                      <span className="text-slate-200">{booking.classBooked}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Passenger</span>
                      <span className="text-slate-200">{booking.passengerName}</span>
                    </div>
                    <div className="border-t border-slate-700 pt-3 flex justify-between">
                      <span className="text-slate-200 font-medium">Total</span>
                      <span className="text-xl font-bold text-amber-400">₹{booking.fare}</span>
                    </div>
                  </div>
                </div>

                {/* Payment method — handled by Razorpay checkout */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-400 uppercase mb-3">Payment Method</h3>
                  <p className="text-sm text-slate-500">
                    Card, UPI, Net Banking, and Wallets — choose your preferred method in the secure checkout window.
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {["Card", "UPI", "Net Banking"].map((method) => (
                      <div
                        key={method}
                        className="p-3 rounded-lg border border-slate-700 bg-slate-800/50 text-center text-sm text-slate-400"
                      >
                        {method}
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handlePayment} loading={paying} size="lg" className="w-full">
                  Pay ₹{booking.fare}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
