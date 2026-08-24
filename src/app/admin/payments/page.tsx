"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CreditCard, IndianRupee, Clock, RefreshCw } from "lucide-react";
import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";

interface PaymentData { id: string; amount: string; status: string; transactionId: string | null; paidAt: string | null; createdAt: string; booking: { pnr: string; passengerName: string; source: string; destination: string; user: { name: string; email: string }; train: { trainName: string; trainNumber: string } } }
interface Stats { totalRevenue: number; todayRevenue: number; pendingCount: number; refundedCount: number }

export default function AdminPaymentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [updatePayment, setUpdatePayment] = useState<{ id: string; current: string } | null>(null);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      if ((session?.user as { role?: string })?.role !== "ADMIN") { router.push("/dashboard"); return; }
      fetch("/api/admin/payments").then(r => r.json()).then(d => { setPayments(d.payments || []); setStats(d.stats || null); }).finally(() => setLoading(false));
    }
  }, [status, session, router]);

  const handleStatusUpdate = async () => {
    if (!updatePayment || !newStatus) return;
    const res = await fetch("/api/admin/payments", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentId: updatePayment.id, status: newStatus }) });
    if (res.ok) { toast.success("Payment status updated"); setPayments(payments.map(p => p.id === updatePayment.id ? { ...p, status: newStatus } : p)); }
    else toast.error("Failed");
    setUpdatePayment(null);
  };

  const filtered = payments.filter(p => !statusFilter || p.status === statusFilter);
  const sv = (s: string) => { switch(s) { case "SUCCESS": return "success"; case "PENDING": return "warning"; case "FAILED": return "danger"; case "REFUNDED": return "info"; default: return "default"; } };

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2 mb-6"><CreditCard size={24} className="text-amber-500" />Payments Overview</h1>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card variant="default"><CardContent className="p-4"><p className="text-xs text-slate-500">Total Revenue</p><p className="text-xl font-bold text-emerald-400">₹{stats.totalRevenue.toLocaleString()}</p></CardContent></Card>
              <Card variant="default"><CardContent className="p-4"><p className="text-xs text-slate-500">Today</p><p className="text-xl font-bold text-amber-400">₹{stats.todayRevenue.toLocaleString()}</p></CardContent></Card>
              <Card variant="default"><CardContent className="p-4"><p className="text-xs text-slate-500">Pending</p><p className="text-xl font-bold text-orange-400">{stats.pendingCount}</p></CardContent></Card>
              <Card variant="default"><CardContent className="p-4"><p className="text-xs text-slate-500">Refunded</p><p className="text-xl font-bold text-blue-400">{stats.refundedCount}</p></CardContent></Card>
            </div>
          )}

          <div className="mb-4"><Select options={[{value:"",label:"All Statuses"},{value:"SUCCESS",label:"Success"},{value:"PENDING",label:"Pending"},{value:"FAILED",label:"Failed"},{value:"REFUNDED",label:"Refunded"}]} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-44" /></div>

          {loading ? <Skeleton className="h-64" /> : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/60"><tr className="text-left text-slate-400">
                  <th className="px-3 py-3">PNR</th><th className="px-3 py-3">Passenger</th><th className="px-3 py-3">Train</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Transaction</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Action</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-slate-800/30">
                      <td className="px-3 py-3 font-mono text-amber-400 text-xs">{p.booking.pnr}</td>
                      <td className="px-3 py-3"><p className="text-slate-200">{p.booking.user.name}</p><p className="text-xs text-slate-500">{p.booking.user.email}</p></td>
                      <td className="px-3 py-3 text-slate-300 text-xs">{p.booking.train.trainName}</td>
                      <td className="px-3 py-3 text-slate-200 font-medium">₹{p.amount}</td>
                      <td className="px-3 py-3"><Badge variant={sv(p.status)}>{p.status}</Badge></td>
                      <td className="px-3 py-3 text-xs text-slate-500 font-mono">{p.transactionId || "—"}</td>
                      <td className="px-3 py-3 text-xs text-slate-500">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"}</td>
                      <td className="px-3 py-3"><Button size="sm" variant="ghost" onClick={() => { setUpdatePayment({ id: p.id, current: p.status }); setNewStatus(p.status); }}>Update</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
        <Modal isOpen={!!updatePayment} onClose={() => setUpdatePayment(null)} title="Update Payment Status">
          <Select label="Status" options={[{value:"PENDING",label:"Pending"},{value:"SUCCESS",label:"Success"},{value:"FAILED",label:"Failed"},{value:"REFUNDED",label:"Refunded"}]} value={newStatus} onChange={e => setNewStatus(e.target.value)} />
          <div className="flex gap-3 mt-4"><Button variant="secondary" onClick={() => setUpdatePayment(null)} className="flex-1">Cancel</Button><Button onClick={handleStatusUpdate} className="flex-1">Update</Button></div>
        </Modal>
      </main>
    </div>
  );
}
