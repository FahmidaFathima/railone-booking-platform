"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Users, Ticket, Train, CreditCard, Clock } from "lucide-react";
import Link from "next/link";

import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Stats {
  totalUsers: number;
  totalBookings: number;
  totalTrains: number;
  totalRevenue: number;
  recentBookings: { id: string; pnr: string; status: string; createdAt: string; user: { name: string }; train: { trainName: string } }[];
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      if ((session?.user as { role?: string })?.role !== "ADMIN") { router.push("/dashboard"); return; }
      fetch("/api/admin/stats").then(r => r.json()).then(setStats).finally(() => setLoading(false));
    }
  }, [status, session, router]);

  const statusVariant = (s: string) => { switch(s) { case "CONFIRMED": return "success"; case "PENDING_PAYMENT": return "warning"; case "CANCELLED": return "danger"; default: return "default"; } };

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <Shield size={28} className="text-amber-500" />
            <h1 className="text-2xl font-bold text-slate-100">Admin Panel</h1>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}</div>
          ) : stats && (
            <>
              {/* Stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Total Users", value: stats.totalUsers, icon: Users, href: "/admin/users" },
                  { label: "Total Bookings", value: stats.totalBookings, icon: Ticket, href: "/admin/bookings" },
                  { label: "Active Trains", value: stats.totalTrains, icon: Train, href: "/admin/trains" },
                  { label: "Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, icon: CreditCard, href: "/admin/payments" },
                ].map(s => (
                  <Link key={s.label} href={s.href}>
                    <Card variant="elevated" className="hover:border-amber-500/30 cursor-pointer">
                      <CardContent className="flex items-center gap-3 p-5">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><s.icon size={20} className="text-amber-500" /></div>
                        <div><p className="text-2xl font-bold text-slate-100">{s.value}</p><p className="text-xs text-slate-500">{s.label}</p></div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Quick links */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Manage Users", href: "/admin/users", desc: "Roles, suspend accounts" },
                  { label: "Manage Trains", href: "/admin/trains", desc: "CRUD trains & routes" },
                  { label: "All Bookings", href: "/admin/bookings", desc: "Status changes, oversight" },
                  { label: "Payments", href: "/admin/payments", desc: "Revenue, refunds" },
                ].map(l => (
                  <Link key={l.label} href={l.href}>
                    <Card variant="default" className="hover:border-slate-600 cursor-pointer h-full">
                      <CardContent><h3 className="font-semibold text-slate-200 mb-1">{l.label}</h3><p className="text-xs text-slate-500">{l.desc}</p></CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Recent activity */}
              <Card variant="default">
                <CardContent>
                  <h2 className="text-sm font-medium text-slate-400 uppercase mb-4 flex items-center gap-2"><Clock size={16} />Recent Activity</h2>
                  {stats.recentBookings.length === 0 ? <p className="text-slate-500 text-sm">No bookings yet.</p> : (
                    <div className="space-y-3">
                      {stats.recentBookings.map(b => (
                        <div key={b.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                          <div>
                            <p className="text-sm text-slate-200">{b.user.name} booked <span className="text-amber-400">{b.train.trainName}</span></p>
                            <p className="text-xs text-slate-500">{new Date(b.createdAt).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-400">{b.pnr}</span>
                            <Badge variant={statusVariant(b.status)}>{b.status.replace("_"," ")}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
