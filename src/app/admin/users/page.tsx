"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Users, Shield, Ban, CheckCircle, Mail, Calendar, Ticket } from "lucide-react";
import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface UserData { id: string; name: string; email: string; phone: string | null; role: string; isActive: boolean; createdAt: string; _count: { bookings: number } }

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ userId: string; action: string; value?: string; userName?: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      if ((session?.user as { role?: string })?.role !== "ADMIN") { router.push("/dashboard"); return; }
      loadUsers();
    }
  }, [status, session, router]);

  const loadUsers = () => { fetch("/api/admin/users").then(r => r.json()).then(d => setUsers(Array.isArray(d) ? d : [])).finally(() => setLoading(false)); };

  const executeAction = async () => {
    if (!confirmAction) return;
    const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(confirmAction) });
    const data = await res.json();
    if (res.ok) { toast.success(data.message); loadUsers(); } else toast.error(data.error);
    setConfirmAction(null);
  };

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2"><Users size={24} className="text-amber-500" />User Management</h1>
            <span className="text-sm text-slate-500">{users.length} total users</span>
          </div>

          <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="mb-6 max-w-md" />

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-44" />)}
            </div>
          ) : filtered.length === 0 ? (
            <Card variant="default" className="text-center py-12">
              <CardContent><p className="text-slate-400">No users match your search.</p></CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((u, i) => (
                <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card variant="elevated" className={`h-full ${!u.isActive ? "opacity-60 border-red-500/20" : ""}`}>
                    <CardContent className="p-5">
                      {/* Header: Name + Role badge */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${u.role === "ADMIN" ? "bg-amber-500/20 text-amber-400" : "bg-slate-700 text-slate-300"}`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-100 text-sm">{u.name}</h3>
                            <Badge variant={u.role === "ADMIN" ? "warning" : "default"} className="mt-0.5">{u.role}</Badge>
                          </div>
                        </div>
                        {!u.isActive && <Badge variant="danger">Suspended</Badge>}
                      </div>

                      {/* Info */}
                      <div className="space-y-1.5 mb-4">
                        <p className="text-xs text-slate-400 flex items-center gap-1.5"><Mail size={12} />{u.email}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5"><Calendar size={12} />Joined {new Date(u.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5"><Ticket size={12} />{u._count.bookings} booking{u._count.bookings !== 1 ? "s" : ""}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t border-slate-800">
                        <Button size="sm" variant="ghost" className="flex-1 text-xs" onClick={() => setConfirmAction({ userId: u.id, action: "changeRole", value: u.role === "ADMIN" ? "PASSENGER" : "ADMIN", userName: u.name })}>
                          <Shield size={12} className="mr-1" />{u.role === "ADMIN" ? "Demote" : "Promote"}
                        </Button>
                        <Button size="sm" variant="ghost" className="flex-1 text-xs" onClick={() => setConfirmAction({ userId: u.id, action: "toggleActive", userName: u.name })}>
                          {u.isActive ? <><Ban size={12} className="mr-1" />Suspend</> : <><CheckCircle size={12} className="mr-1" />Activate</>}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <Modal isOpen={!!confirmAction} onClose={() => setConfirmAction(null)} title="Confirm Action">
          <p className="text-slate-400 text-sm mb-4">
            {confirmAction?.action === "changeRole"
              ? `Change ${confirmAction?.userName}'s role to ${confirmAction?.value}?`
              : `${confirmAction?.userName}: Toggle active status?`}
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setConfirmAction(null)} className="flex-1">Cancel</Button>
            <Button onClick={executeAction} className="flex-1">Confirm</Button>
          </div>
        </Modal>
      </main>
    </div>
  );
}
