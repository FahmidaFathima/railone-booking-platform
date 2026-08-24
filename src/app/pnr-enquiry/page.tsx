"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Search, Train, MapPin, Calendar, Clock, User } from "lucide-react";

import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface PnrResult {
  id: string;
  pnr: string;
  passengerName: string;
  gender: string;
  source: string;
  destination: string;
  journeyDate: string;
  classBooked: string;
  seatNumber: string;
  status: string;
  fare: string;
  train: {
    trainName: string;
    trainNumber: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
  };
  payment?: {
    status: string;
    transactionId: string;
  };
}

export default function PnrEnquiryPage() {
  const { status } = useSession();
  const router = useRouter();
  const [pnr, setPnr] = useState("");
  const [result, setResult] = useState<PnrResult | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const handleSearch = async () => {
    if (!pnr || pnr.length !== 10) {
      toast.error("Please enter a valid 10-digit PNR number");
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/cancellations?pnr=${pnr}`);
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        toast.error(data.error || "PNR not found");
        setResult(null);
      }
    } catch {
      toast.error("Search failed");
    }
    setSearching(false);
  };

  const statusBadge = (s: string) => {
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-100 mb-2">PNR Enquiry</h1>
          <p className="text-slate-400">Track your booking status instantly</p>
        </motion.div>

        {/* Search Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          <Card variant="glass" className="max-w-lg mx-auto mb-8">
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter 10-digit PNR number"
                  value={pnr}
                  onChange={(e) => setPnr(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="flex-1 font-mono text-lg text-center tracking-wider"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} loading={searching} size="lg">
                  <Search size={20} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Result Card - Boarding Pass Style */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: [0.16, 1, 0.3, 1] }}
          >
            <Card variant="glass" className="overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 p-6 border-b border-amber-500/10">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Train size={24} className="text-amber-500" />
                    <div>
                      <h2 className="text-lg font-bold text-slate-100">{result.train.trainName}</h2>
                      <p className="text-sm text-slate-400">#{result.train.trainNumber}</p>
                    </div>
                  </div>
                  <Badge variant={statusBadge(result.status)} className="text-sm px-3 py-1">
                    {result.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6">
                {/* Route visualization */}
                <div className="flex items-center justify-between mb-6 px-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-100">{result.source}</p>
                    <p className="text-sm text-slate-400">{result.train.departureTime}</p>
                  </div>
                  <div className="flex-1 mx-4 relative">
                    <div className="h-0.5 bg-slate-700 w-full" />
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-500" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-500" />
                    <div className="absolute left-1/2 -translate-x-1/2 -top-3 text-xs text-slate-500">
                      {result.train.duration}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-100">{result.destination}</p>
                    <p className="text-sm text-slate-400">{result.train.arrivalTime}</p>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-lg bg-slate-800/40">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">PNR</p>
                    <p className="font-mono font-bold text-amber-400">{result.pnr}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Passenger</p>
                    <p className="text-slate-200">{result.passengerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Date</p>
                    <p className="text-slate-200">{new Date(result.journeyDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Class</p>
                    <p className="text-slate-200">{result.classBooked}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Seat</p>
                    <p className="text-slate-200">{result.seatNumber || "Not assigned"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Fare</p>
                    <p className="text-amber-400 font-semibold">₹{result.fare}</p>
                  </div>
                </div>

                {result.payment && (
                  <div className="mt-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Payment Status</span>
                      <Badge variant="success">{result.payment.status}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
