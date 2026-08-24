"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Ticket } from "lucide-react";
import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface BookingData { id: string; pnr: string; passengerName: string; source: string; destination: string; journeyDate: string; classBooked: string; status: string; fare: string; createdAt: string; user: { name: string; email: string }; train: { trainName: string; trainNumber: string } }

export default function AdminBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [changeStatus, setChangeStatus] = useState<{ bookingId: string; current: string } | null>(null);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      if ((session?.user as { role?: string })?.role !== "ADMIN") { router.push("/dashboard"); return; }
      fetch("/api/admin/bookings").then(r => r.json()).then(d => setBookings(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
    }
  }, [status, session, router]);

  const handleStatusChange = async () => {
    if (!changeStatus || !newStatus) return;
    const res = await fetch("/api/admin/bookings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId: changeStatus.bookingId, status: newStatus }) });
    if (res.ok) { toast.success("Status updated"); setBookings(bookings.map(b => b.id === changeStatus.bookingId ? { ...b, status: newStatus } : b)); }
    else toast.error("Failed");
    setChangeStatus(null); setNewStatus("");
  };

  const filtered = bookings.filter(b => {
    const matchesStatus = !statusFilter || b.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q || b.pnr.includes(q) || b.passengerName.toLowerCase().includes(q) || b.user.email.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });
  const sv = (s: string) => { switch(s) { case "CONFIRMED": return "success"; case "PENDING_PAYMENT": return "warning"; case "CANCELLED": return "danger"; case "WAITLISTED": return "info"; default: return "default"; } };

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2 mb-6"><Ticket size={24} className="text-amber-500" />All Bookings</h1>
          <Card variant="default" className="mb-4"><CardContent className="flex flex-col sm:flex-row gap-3 p-4">
            <Input placeholder="Search PNR, name, email..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1" />
            <Select options={[{value:"",label:"All"},{value:"CONFIRMED",label:"Confirmed"},{value:"PENDING_PAYMENT",label:"Pending"},{value:"CANCELLED",label:"Cancelled"},{value:"WAITLISTED",label:"Waitlisted"}]} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-44" />
          </CardContent></Card>

          {loading ? <Skeleton className="h-64" /> : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/60"><tr className="text-left text-slate-400">
                  <th className="px-3 py-3">PNR</th><th className="px-3 py-3">Passenger</th><th className="px-3 py-3">Train</th><th className="px-3 py-3">Route</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Fare</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Action</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.map(b => (
                    <tr key={b.id} className="hover:bg-slate-800/30">
                      <td className="px-3 py-3 font-mono text-amber-400 text-xs">{b.pnr}</td>
                      <td className="px-3 py-3"><p className="text-slate-200">{b.passengerName}</p><p className="text-xs text-slate-500">{b.user.email}</p></td>
                      <td className="px-3 py-3 text-slate-300 text-xs">{b.train.trainName}</td>
                      <td className="px-3 py-3 text-slate-400 text-xs">{b.source}→{b.destination}</td>
                      <td className="px-3 py-3 text-slate-400 text-xs">{new Date(b.journeyDate).toLocaleDateString()}</td>
                      <td className="px-3 py-3 text-slate-200">₹{b.fare}</td>
                      <td className="px-3 py-3"><Badge variant={sv(b.status)}>{b.status.replace("_"," ")}</Badge></td>
                      <td className="px-3 py-3"><Button size="sm" variant="ghost" onClick={() => { setChangeStatus({ bookingId: b.id, current: b.status }); setNewStatus(b.status); }}>Change</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
        <Modal isOpen={!!changeStatus} onClose={() => setChangeStatus(null)} title="Change Booking Status">
          <Select label="New Status" options={[{value:"PENDING_PAYMENT",label:"Pending Payment"},{value:"CONFIRMED",label:"Confirmed"},{value:"CANCELLED",label:"Cancelled"},{value:"WAITLISTED",label:"Waitlisted"}]} value={newStatus} onChange={e => setNewStatus(e.target.value)} />
          <div className="flex gap-3 mt-4"><Button variant="secondary" onClick={() => setChangeStatus(null)} className="flex-1">Cancel</Button><Button onClick={handleStatusChange} className="flex-1">Update</Button></div>
        </Modal>
      </main>
    </div>
  );
}
