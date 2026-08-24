"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { XCircle, Search, AlertTriangle, Train, MapPin, Calendar } from "lucide-react";

import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { cancellationSchema, CancellationInput } from "@/lib/validators";

const REASONS = [
  { value: "change_of_plans", label: "Change of Plans" },
  { value: "medical_emergency", label: "Medical Emergency" },
  { value: "duplicate_booking", label: "Duplicate Booking" },
  { value: "other", label: "Other" },
];

interface BookingInfo {
  id: string;
  pnr: string;
  passengerName: string;
  source: string;
  destination: string;
  journeyDate: string;
  classBooked: string;
  fare: string;
  status: string;
  train: { trainName: string; trainNumber: string };
}

export default function CancellationPage() {
  const { status } = useSession();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [searching, setSearching] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [refundAmount, setRefundAmount] = useState(0);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<CancellationInput>({
    resolver: zodResolver(cancellationSchema),
  });

  const pnrValue = watch("pnr");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const searchBooking = async () => {
    if (!pnrValue || pnrValue.length !== 10) {
      toast.error("Enter a valid 10-digit PNR");
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/cancellations?pnr=${pnrValue}`);
      const data = await res.json();
      if (res.ok) {
        setBooking(data);
        // Calculate refund preview
        const journeyDate = new Date(data.journeyDate);
        const hoursUntil = (journeyDate.getTime() - Date.now()) / (1000 * 60 * 60);
        const fare = Number(data.fare);
        if (hoursUntil > 48) setRefundAmount(Math.round(fare * 0.9));
        else if (hoursUntil > 24) setRefundAmount(Math.round(fare * 0.5));
        else setRefundAmount(0);
      } else {
        toast.error(data.error || "Booking not found");
        setBooking(null);
      }
    } catch {
      toast.error("Search failed");
    }
    setSearching(false);
  };

  const onSubmit = () => {
    setConfirmOpen(true);
  };

  const confirmCancellation = async () => {
    setCancelling(true);
    const reason = (document.getElementById("reason") as HTMLSelectElement)?.value || "other";

    try {
      const res = await fetch("/api/cancellations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pnr: pnrValue, reason }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setConfirmOpen(false);
        setBooking(null);
        router.push("/dashboard");
      } else {
        toast.error(data.error || "Cancellation failed");
      }
    } catch {
      toast.error("Cancellation failed");
    }
    setCancelling(false);
  };

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            <XCircle size={24} className="text-red-400" />
            Cancel Ticket
          </h1>

          <Card variant="glass" className="mb-6">
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter 10-digit PNR number"
                  maxLength={10}
                  className="flex-1 font-mono"
                  {...register("pnr")}
                />
                <Button onClick={searchBooking} loading={searching}>
                  <Search size={18} className="mr-2" />
                  Find
                </Button>
              </div>
              {errors.pnr && <p className="text-xs text-red-400 mt-2">{errors.pnr.message}</p>}
            </CardContent>
          </Card>

          {booking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ease: [0.16, 1, 0.3, 1] }}
            >
              <Card variant="elevated" className="mb-6">
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-100">{booking.train.trainName}</h3>
                    <Badge variant={booking.status === "CONFIRMED" ? "success" : "warning"}>
                      {booking.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Passenger</p>
                      <p className="text-slate-200">{booking.passengerName}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Route</p>
                      <p className="text-slate-200">{booking.source} → {booking.destination}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Journey Date</p>
                      <p className="text-slate-200">{new Date(booking.journeyDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Fare Paid</p>
                      <p className="text-slate-200">₹{booking.fare}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {booking.status === "CANCELLED" ? (
                <Card variant="default" className="border-red-500/20">
                  <CardContent className="text-center py-6">
                    <p className="text-red-400">This ticket is already cancelled.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card variant="glass">
                  <CardContent>
                    <h3 className="text-sm font-medium text-slate-400 uppercase mb-3">Cancellation Details</h3>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      <Select
                        id="reason"
                        label="Reason for Cancellation"
                        options={REASONS}
                        placeholder="Select a reason"
                        error={errors.reason?.message}
                        {...register("reason")}
                      />

                      {/* Refund info */}
                      <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">Estimated Refund</span>
                          <span className="text-xl font-bold text-amber-400">₹{refundAmount}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {refundAmount > 0
                            ? "Refund will be processed within 5-7 business days."
                            : "No refund for cancellations within 24 hours of journey."}
                        </p>
                      </div>

                      <Button type="submit" variant="danger" size="lg" className="w-full">
                        Cancel Ticket
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Confirmation Modal */}
      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Cancellation">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle size={24} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-slate-300">
              Are you sure you want to cancel this ticket? This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)} className="flex-1">
              Keep Ticket
            </Button>
            <Button variant="danger" onClick={confirmCancellation} loading={cancelling} className="flex-1">
              Confirm Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
