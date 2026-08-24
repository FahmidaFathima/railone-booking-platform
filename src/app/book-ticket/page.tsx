"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import {
  Search, MapPin, Calendar, Clock, Users, ArrowRight,
  Train as TrainIcon, Check, AlertTriangle, SortAsc, Filter,
} from "lucide-react";

import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const RouteGlobe = dynamic(() => import("@/components/3d/RouteGlobe"), {
  ssr: false,
  loading: () => <div className="w-full h-64 lg:h-80 rounded-xl bg-slate-900/30 animate-pulse" />,
});
import { passengerSchema, PassengerInput } from "@/lib/validators";

const STATIONS = [
  "Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata",
  "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow",
  "Chandigarh", "Goa", "Kochi", "Bhopal", "Patna",
];

interface TrainClass {
  id: string;
  className: string;
  fareMultiplier: string;
  seatsAvailable: number;
}

interface TrainResult {
  id: string;
  trainNumber: string;
  trainName: string;
  source: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  totalSeats: number;
  fare: string;
  classes: TrainClass[];
}

const steps = ["Search", "Select Train", "Passenger Details", "Review"];

type SortOption = "price" | "duration" | "departure";
type TimeFilter = "" | "early" | "morning" | "afternoon" | "evening" | "night";

function getHour(time: string): number {
  return parseInt(time.split(":")[0]);
}

function matchesTimeFilter(dep: string, filter: TimeFilter): boolean {
  if (!filter) return true;
  const h = getHour(dep);
  switch (filter) {
    case "early": return h >= 0 && h < 6;
    case "morning": return h >= 6 && h < 12;
    case "afternoon": return h >= 12 && h < 16;
    case "evening": return h >= 16 && h < 21;
    case "night": return h >= 21 || h < 0;
    default: return true;
  }
}

function parseDuration(d: string): number {
  const match = d.match(/(\d+)h\s*(\d*)/);
  if (!match) return 0;
  return parseInt(match[1]) * 60 + (parseInt(match[2]) || 0);
}

export default function BookTicketPage() {
  const { status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [trains, setTrains] = useState<TrainResult[]>([]);
  const [selectedTrain, setSelectedTrain] = useState<TrainResult | null>(null);
  const [selectedClass, setSelectedClass] = useState<TrainClass | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [booking, setBooking] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("departure");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("");
  const [passengerData, setPassengerData] = useState<PassengerInput | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<PassengerInput>({
    resolver: zodResolver(passengerSchema),
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const searchTrains = async () => {
    if (!source || !destination || !date) { toast.error("Please fill all search fields"); return; }
    if (source === destination) { toast.error("Source and destination cannot be the same"); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/trains?source=${source}&destination=${destination}`);
      const data = await res.json();
      setTrains(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length === 0) {
        toast.info("No trains found for this route. Try different cities.");
      } else {
        toast.success(`Found ${data.length} train${data.length > 1 ? "s" : ""}`);
      }
      setCurrentStep(1);
    } catch { toast.error("Failed to search trains"); }
    setSearching(false);
  };

  // Filter and sort
  const filteredTrains = trains
    .filter(t => matchesTimeFilter(t.departureTime, timeFilter))
    .sort((a, b) => {
      switch (sortBy) {
        case "price": return Number(a.fare) - Number(b.fare);
        case "duration": return parseDuration(a.duration) - parseDuration(b.duration);
        case "departure": return getHour(a.departureTime) - getHour(b.departureTime);
        default: return 0;
      }
    });

  const selectTrain = (train: TrainResult, trainClass: TrainClass) => {
    setSelectedTrain(train);
    setSelectedClass(trainClass);
    setSelectedSeat(null);
    setCurrentStep(2);
  };

  const onPassengerSubmit = (data: PassengerInput) => {
    setPassengerData(data);
    setCurrentStep(3);
  };

  const calculateFare = () => {
    if (!selectedTrain || !selectedClass) return 0;
    return Math.round(Number(selectedTrain.fare) * Number(selectedClass.fareMultiplier));
  };

  const fareBreakdown = () => {
    const total = calculateFare();
    const base = Math.round(total * 0.82);
    const gst = Math.round(total * 0.05);
    const convenience = total - base - gst;
    return { base, gst, convenience, total };
  };

  const confirmBooking = async () => {
    if (!selectedTrain || !selectedClass || !passengerData) return;
    setBooking(true);
    const isWaitlisted = selectedClass.seatsAvailable <= 0;
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...passengerData,
          trainId: selectedTrain.id,
          classBooked: selectedClass.className,
          source, destination,
          journeyDate: date,
          fare: calculateFare(),
          seatNumber: selectedSeat,
          waitlisted: isWaitlisted,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (isWaitlisted) {
          toast.info(`Booking waitlisted! PNR: ${data.pnr}. You'll be notified when confirmed.`);
          router.push("/my-bookings");
        } else {
          toast.success(`Booking confirmed! PNR: ${data.pnr}`);
          router.push(`/payment/${data.id}`);
        }
      } else { toast.error(data.error || "Booking failed"); }
    } catch { toast.error("Something went wrong"); }
    setBooking(false);
  };

  // Seat map generation
  const generateSeats = () => {
    if (!selectedClass) return [];
    const total = selectedClass.seatsAvailable + Math.floor(Math.random() * 20);
    const seats: { number: string; available: boolean }[] = [];
    const prefix = selectedClass.className.charAt(0);
    for (let i = 1; i <= Math.min(total, 72); i++) {
      seats.push({ number: `${prefix}${i}`, available: i <= selectedClass.seatsAvailable });
    }
    return seats;
  };

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-800" />
            <div className="absolute top-5 left-0 h-0.5 bg-amber-500 transition-all duration-500" style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }} />
            {steps.map((step, i) => (
              <div key={step} className="relative flex flex-col items-center z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${i <= currentStep ? "bg-amber-500 text-slate-900" : "bg-slate-800 text-slate-500 border border-slate-700"}`}>
                  {i < currentStep ? <Check size={16} /> : i + 1}
                </div>
                <span className={`mt-2 text-xs hidden sm:block ${i <= currentStep ? "text-amber-400" : "text-slate-500"}`}>{step}</span>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Search */}
          {currentStep === 0 && (
            <motion.div key="search" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ ease: [0.16, 1, 0.3, 1] }}
              className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 max-w-[1400px] mx-auto">
                <Card variant="glass" className="self-start">
                  <CardContent>
                    <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2"><Search size={24} className="text-amber-500" />Search Trains</h2>
                    <div className="space-y-4">
                      <div className="space-y-4">
                        <Select label="From" options={STATIONS.map(s => ({ value: s, label: s }))} placeholder="Select source" value={source} onChange={(e) => setSource(e.target.value)} />
                        <Select label="To" options={STATIONS.map(s => ({ value: s, label: s }))} placeholder="Select destination" value={destination} onChange={(e) => setDestination(e.target.value)} />
                      </div>
                      <Input label="Journey Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                      <Button onClick={searchTrains} loading={searching} size="lg" className="w-full">Search Trains<ArrowRight size={18} className="ml-2" /></Button>
                    </div>
                  </CardContent>
                </Card>
                {/* 3D Route Globe — large panel filling most of the viewport */}
                <div className="hidden lg:block h-[36rem] rounded-xl overflow-hidden">
                  <RouteGlobe source={source} destination={destination} />
                </div>
              </div>
              {/* Mobile: compact globe below form */}
              <div className="lg:hidden mt-4 h-56 max-w-5xl mx-auto">
                <RouteGlobe source={source} destination={destination} />
              </div>
            </motion.div>
          )}

          {/* Step 2: Results with filters */}
          {currentStep === 1 && (
            <motion.div key="results" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ ease: [0.16, 1, 0.3, 1] }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                <h2 className="text-2xl font-bold text-slate-100">{filteredTrains.length} Train{filteredTrains.length !== 1 ? "s" : ""} Found</h2>
                <Button variant="ghost" onClick={() => setCurrentStep(0)}>← Back to Search</Button>
              </div>

              {/* Filters & Sort */}
              <Card variant="default" className="mb-4">
                <CardContent className="flex flex-col sm:flex-row gap-3 p-4">
                  <div className="flex flex-wrap gap-2 flex-1">
                    {[
                      { value: "" as TimeFilter, label: "All Times" },
                      { value: "early" as TimeFilter, label: "Early (0-6)" },
                      { value: "morning" as TimeFilter, label: "Morning (6-12)" },
                      { value: "afternoon" as TimeFilter, label: "Afternoon (12-16)" },
                      { value: "evening" as TimeFilter, label: "Evening (16-21)" },
                      { value: "night" as TimeFilter, label: "Night (21+)" },
                    ].map(f => (
                      <button key={f.value} onClick={() => setTimeFilter(f.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${timeFilter === f.value ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"}`}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <Select
                    options={[{ value: "departure", label: "Sort: Departure" }, { value: "price", label: "Sort: Price" }, { value: "duration", label: "Sort: Duration" }]}
                    value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-44"
                  />
                </CardContent>
              </Card>

              {filteredTrains.length === 0 ? (
                <Card variant="default" className="text-center py-12">
                  <CardContent>
                    <TrainIcon size={48} className="text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 mb-2">No trains match your filters.</p>
                    <p className="text-sm text-slate-500">Try adjusting the time filter or search for a different route.</p>
                    <Button variant="secondary" className="mt-4" onClick={() => { setTimeFilter(""); }}>Clear Filters</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredTrains.map(train => (
                    <Card key={train.id} variant="elevated">
                      <CardContent>
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <TrainIcon size={18} className="text-amber-500" />
                              <h3 className="font-semibold text-slate-100">{train.trainName}</h3>
                              <span className="text-sm text-slate-500 font-mono">#{train.trainNumber}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                              <span className="flex items-center gap-1"><MapPin size={14} />{train.source} → {train.destination}</span>
                              <span className="flex items-center gap-1"><Clock size={14} />{train.departureTime} - {train.arrivalTime}</span>
                              <span>{train.duration}</span>
                            </div>
                          </div>
                        </div>
                        {/* Classes */}
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {train.classes.map(cls => {
                            const fare = Math.round(Number(train.fare) * Number(cls.fareMultiplier));
                            const lowSeats = cls.seatsAvailable <= 5 && cls.seatsAvailable > 0;
                            const noSeats = cls.seatsAvailable <= 0;
                            return (
                              <button key={cls.id} onClick={() => selectTrain(train, cls)}
                                className={`p-3 rounded-lg border transition-all text-left group ${noSeats ? "border-red-500/30 bg-red-500/5 hover:border-red-500/50" : "border-slate-700 hover:border-amber-500/50 bg-slate-800/50 hover:bg-slate-800"}`}>
                                <p className="text-sm font-medium text-slate-200">{cls.className}</p>
                                <p className="text-lg font-bold text-amber-400">₹{fare}</p>
                                <div className="flex items-center gap-1 text-xs">
                                  {noSeats ? (
                                    <span className="text-red-400 flex items-center gap-1"><AlertTriangle size={10} />Waitlist</span>
                                  ) : lowSeats ? (
                                    <span className="text-orange-400 flex items-center gap-1"><AlertTriangle size={10} />Only {cls.seatsAvailable} left!</span>
                                  ) : (
                                    <span className="text-slate-500 flex items-center gap-1"><Users size={12} />{cls.seatsAvailable} seats</span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 3: Passenger + Seat Selection */}
          {currentStep === 2 && (
            <motion.div key="passenger" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ ease: [0.16, 1, 0.3, 1] }}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Passenger form */}
                <Card variant="glass" className="lg:col-span-2">
                  <CardContent>
                    <h2 className="text-xl font-bold text-slate-100 mb-4">Passenger Details</h2>
                    <form id="passenger-form" onSubmit={handleSubmit(onPassengerSubmit)} className="space-y-4">
                      <Input id="passengerName" label="Full Name" placeholder="Enter passenger name" error={errors.passengerName?.message} {...register("passengerName")} />
                      <div className="grid grid-cols-2 gap-4">
                        <Select id="gender" label="Gender" options={[{ value: "MALE", label: "Male" }, { value: "FEMALE", label: "Female" }, { value: "OTHER", label: "Other" }]} placeholder="Select" error={errors.gender?.message} {...register("gender")} />
                        <Input id="age" label="Age" type="number" placeholder="25" error={errors.age?.message} {...register("age", { valueAsNumber: true })} />
                      </div>
                      <Input id="aadharNumber" label="Aadhar Number" placeholder="12-digit Aadhar" maxLength={12} error={errors.aadharNumber?.message} {...register("aadharNumber")} />
                      <Input id="address" label="Address" placeholder="Your address" error={errors.address?.message} {...register("address")} />
                      <Input id="phone" label="Phone" placeholder="10-digit phone" maxLength={10} error={errors.phone?.message} {...register("phone")} />
                      <div className="flex gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setCurrentStep(1)} type="button">← Back</Button>
                        <Button type="submit" className="flex-1">Continue<ArrowRight size={18} className="ml-2" /></Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Seat map */}
                <Card variant="default">
                  <CardContent>
                    <h3 className="text-sm font-medium text-slate-400 uppercase mb-3">Select Seat</h3>
                    {selectedClass && selectedClass.seatsAvailable > 0 ? (
                      <>
                        <div className="flex gap-3 mb-3 text-xs">
                          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50" /> Available</span>
                          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500" /> Selected</span>
                          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-700" /> Booked</span>
                        </div>
                        <div className="grid grid-cols-6 gap-1.5 max-h-64 overflow-y-auto pr-1">
                          {generateSeats().map(seat => (
                            <button key={seat.number} disabled={!seat.available}
                              onClick={() => setSelectedSeat(seat.number)}
                              className={`p-1.5 rounded text-[10px] font-mono transition-all ${
                                selectedSeat === seat.number ? "bg-amber-500 text-slate-900 font-bold" :
                                seat.available ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" :
                                "bg-slate-800 text-slate-600 cursor-not-allowed"
                              }`}>
                              {seat.number}
                            </button>
                          ))}
                        </div>
                        {selectedSeat && <p className="mt-3 text-sm text-amber-400">Seat: {selectedSeat}</p>}
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <AlertTriangle size={24} className="text-orange-400 mx-auto mb-2" />
                        <p className="text-sm text-orange-400">This class is fully booked.</p>
                        <p className="text-xs text-slate-500 mt-1">You&apos;ll be added to the waitlist.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Step 4: Review with fare breakdown */}
          {currentStep === 3 && selectedTrain && selectedClass && (
            <motion.div key="review" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ ease: [0.16, 1, 0.3, 1] }}>
              <Card variant="glass" className="max-w-2xl mx-auto">
                <CardContent>
                  <h2 className="text-2xl font-bold text-slate-100 mb-6">Booking Summary</h2>
                  <div className="space-y-4">
                    {/* Train info */}
                    <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700">
                      <div className="flex items-center gap-2 mb-3">
                        <TrainIcon size={18} className="text-amber-500" />
                        <span className="font-semibold text-slate-100">{selectedTrain.trainName}</span>
                        <span className="text-sm text-slate-500">#{selectedTrain.trainNumber}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><p className="text-slate-500">Route</p><p className="text-slate-200">{source} → {destination}</p></div>
                        <div><p className="text-slate-500">Date</p><p className="text-slate-200">{new Date(date).toLocaleDateString()}</p></div>
                        <div><p className="text-slate-500">Time</p><p className="text-slate-200">{selectedTrain.departureTime} - {selectedTrain.arrivalTime}</p></div>
                        <div><p className="text-slate-500">Class / Seat</p><p className="text-slate-200">{selectedClass.className} · {selectedSeat || "Auto-assign"}</p></div>
                      </div>
                    </div>

                    {/* Passenger */}
                    {passengerData && (
                      <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50 text-sm">
                        <p className="text-slate-500 mb-2">Passenger</p>
                        <p className="text-slate-200">{passengerData.passengerName} · {passengerData.gender} · Age {passengerData.age}</p>
                        <p className="text-slate-400 mt-1">{passengerData.phone}</p>
                      </div>
                    )}

                    {/* Fare breakdown */}
                    <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-2">
                      {(() => { const fb = fareBreakdown(); return (<>
                        <div className="flex justify-between text-sm"><span className="text-slate-400">Base Fare</span><span className="text-slate-300">₹{fb.base}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-slate-400">GST (5%)</span><span className="text-slate-300">₹{fb.gst}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-slate-400">Convenience Fee</span><span className="text-slate-300">₹{fb.convenience}</span></div>
                        <div className="border-t border-amber-500/20 pt-2 flex justify-between">
                          <span className="text-slate-200 font-medium">Total</span>
                          <span className="text-2xl font-bold text-amber-400">₹{fb.total}</span>
                        </div>
                      </>); })()}
                    </div>

                    {selectedClass.seatsAvailable <= 0 && (
                      <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-orange-400" />
                        <p className="text-sm text-orange-300">This booking will be waitlisted. You&apos;ll be notified when confirmed.</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button variant="secondary" onClick={() => setCurrentStep(2)}>← Back</Button>
                      <Button onClick={confirmBooking} loading={booking} className="flex-1" size="lg">
                        {selectedClass.seatsAvailable <= 0 ? "Join Waitlist" : "Confirm & Proceed to Payment"}
                        <ArrowRight size={18} className="ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
