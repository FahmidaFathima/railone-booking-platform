"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Search, Train, MapPin, Clock, AlertCircle } from "lucide-react";

import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TrainStatus {
  trainNumber: string;
  trainName: string;
  source: string;
  destination: string;
  currentStation: string;
  nextStation: string;
  delay: number;
  eta: string;
  progress: number; // 0-100
  stations: { name: string; scheduled: string; actual: string; status: "arrived" | "upcoming" | "current" }[];
}

// Simulated stations for a route
const MOCK_STATIONS = [
  "Departed", "En Route Station 1", "En Route Station 2",
  "Junction", "En Route Station 3", "Approaching Destination", "Arrived",
];

export default function TrackTrainPage() {
  const { status } = useSession();
  const router = useRouter();
  const [trainNumber, setTrainNumber] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<TrainStatus | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const handleSearch = async () => {
    if (!trainNumber.trim()) { toast.error("Enter a train number"); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/trains`);
      const trains = await res.json();
      const found = Array.isArray(trains) ? trains.find((t: { trainNumber: string }) => t.trainNumber === trainNumber.trim()) : null;

      if (!found) {
        toast.error("Train not found. Check the number and try again.");
        setResult(null);
      } else {
        // Generate mock live status
        const progress = Math.floor(Math.random() * 80) + 10;
        const delay = Math.random() > 0.6 ? Math.floor(Math.random() * 45) : 0;
        const currentIdx = Math.floor((progress / 100) * 6);
        const stations = MOCK_STATIONS.map((name, i) => {
          const baseHour = parseInt(found.departureTime.split(":")[0]);
          const h = (baseHour + Math.floor(i * 2.5)) % 24;
          const scheduled = `${String(h).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`;
          const actualH = h + (i <= currentIdx && delay > 0 ? Math.floor(delay / 60) : 0);
          const actualM = i <= currentIdx && delay > 0 ? delay % 60 : 0;
          const actual = i <= currentIdx ? `${String(actualH % 24).padStart(2, "0")}:${String(actualM).padStart(2, "0")}` : "--:--";
          return {
            name: i === 0 ? found.source : i === 6 ? found.destination : `Station ${i}`,
            scheduled,
            actual,
            status: (i < currentIdx ? "arrived" : i === currentIdx ? "current" : "upcoming") as "arrived" | "current" | "upcoming",
          };
        });

        const etaHours = Math.ceil(((100 - progress) / 100) * parseInt(found.duration));
        setResult({
          trainNumber: found.trainNumber,
          trainName: found.trainName,
          source: found.source,
          destination: found.destination,
          currentStation: stations[currentIdx]?.name || "En Route",
          nextStation: stations[currentIdx + 1]?.name || found.destination,
          delay,
          eta: `~${etaHours}h remaining`,
          progress,
          stations,
        });
        toast.success("Train status fetched");
      }
    } catch {
      toast.error("Failed to fetch train status");
    }
    setSearching(false);
  };

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: [0.16, 1, 0.3, 1] }}>
          <h1 className="text-2xl font-bold text-slate-100 mb-2 flex items-center gap-2">
            <Train size={24} className="text-amber-500" /> Track Your Train
          </h1>
          <p className="text-slate-400 mb-6">Enter a train number to see live running status</p>

          <Card variant="glass" className="mb-6">
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter train number (e.g. 12001)"
                  value={trainNumber}
                  onChange={(e) => setTrainNumber(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 font-mono"
                />
                <Button onClick={handleSearch} loading={searching}><Search size={18} /></Button>
              </div>
            </CardContent>
          </Card>

          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card variant="elevated" className="mb-6">
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-100">{result.trainName}</h2>
                      <p className="text-sm text-slate-400">#{result.trainNumber} · {result.source} → {result.destination}</p>
                    </div>
                    {result.delay > 0 ? (
                      <Badge variant="warning" className="flex items-center gap-1">
                        <AlertCircle size={12} /> {result.delay} min late
                      </Badge>
                    ) : (
                      <Badge variant="success">On Time</Badge>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>{result.source}</span>
                      <span>{result.eta}</span>
                      <span>{result.destination}</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all"
                        style={{ width: `${result.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Current Station</p>
                      <p className="text-slate-200 font-medium flex items-center gap-1"><MapPin size={14} className="text-amber-500" />{result.currentStation}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Next Stop</p>
                      <p className="text-slate-200 font-medium">{result.nextStation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Station timeline */}
              <Card variant="default">
                <CardContent>
                  <h3 className="text-sm font-medium text-slate-400 uppercase mb-4">Route Timeline</h3>
                  <div className="space-y-0">
                    {result.stations.map((s, i) => (
                      <div key={i} className="flex items-start gap-3 pb-4 relative">
                        {i < result.stations.length - 1 && (
                          <div className={`absolute left-[7px] top-4 w-0.5 h-full ${s.status === "arrived" ? "bg-amber-500" : "bg-slate-700"}`} />
                        )}
                        <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-0.5 ${
                          s.status === "arrived" ? "bg-amber-500" :
                          s.status === "current" ? "bg-amber-500 ring-4 ring-amber-500/20" :
                          "bg-slate-700 border border-slate-600"
                        }`} />
                        <div className="flex-1 flex justify-between items-center">
                          <span className={`text-sm ${s.status === "upcoming" ? "text-slate-500" : "text-slate-200"}`}>{s.name}</span>
                          <div className="text-xs text-right">
                            <span className="text-slate-500">{s.scheduled}</span>
                            {s.actual !== "--:--" && <span className="ml-2 text-slate-300">{s.actual}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
