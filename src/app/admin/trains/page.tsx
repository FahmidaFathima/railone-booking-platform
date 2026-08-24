"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Train, Plus, Pencil, Trash2, X } from "lucide-react";
import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface TrainClass { id: string; className: string; fareMultiplier: string; seatsAvailable: number }
interface TrainData { id: string; trainNumber: string; trainName: string; source: string; destination: string; departureTime: string; arrivalTime: string; duration: string; totalSeats: number; fare: string; isActive: boolean; classes: TrainClass[]; _count: { bookings: number } }

const emptyForm = { trainNumber: "", trainName: "", source: "", destination: "", departureTime: "", arrivalTime: "", duration: "", totalSeats: 500, fare: 500, classes: [{ className: "Sleeper", fareMultiplier: 1.0, seatsAvailable: 150 }] };

export default function AdminTrainsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [trains, setTrains] = useState<TrainData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      if ((session?.user as { role?: string })?.role !== "ADMIN") { router.push("/dashboard"); return; }
      loadTrains();
    }
  }, [status, session, router]);

  const loadTrains = () => { fetch("/api/admin/trains").then(r => r.json()).then(setTrains).finally(() => setLoading(false)); };

  const handleSave = async () => {
    setSaving(true);
    const method = editId ? "PATCH" : "POST";
    const body = editId ? { id: editId, ...form } : form;
    const res = await fetch("/api/admin/trains", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (res.ok) { toast.success(editId ? "Train updated" : "Train created"); setShowForm(false); setEditId(null); setForm(emptyForm); loadTrains(); }
    else toast.error(data.error || "Failed");
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/trains?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Train deactivated"); setDeleteConfirm(null); loadTrains(); }
    else toast.error("Failed to deactivate");
  };

  const openEdit = (t: TrainData) => {
    setEditId(t.id);
    setForm({ trainNumber: t.trainNumber, trainName: t.trainName, source: t.source, destination: t.destination, departureTime: t.departureTime, arrivalTime: t.arrivalTime, duration: t.duration, totalSeats: t.totalSeats, fare: Number(t.fare), classes: t.classes.map(c => ({ className: c.className, fareMultiplier: Number(c.fareMultiplier), seatsAvailable: c.seatsAvailable })) });
    setShowForm(true);
  };

  const addClass = () => setForm({ ...form, classes: [...form.classes, { className: "", fareMultiplier: 1.0, seatsAvailable: 100 }] });
  const removeClass = (i: number) => setForm({ ...form, classes: form.classes.filter((_, idx) => idx !== i) });

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2"><Train size={24} className="text-amber-500" />Train Management</h1>
            <Button onClick={() => { setEditId(null); setForm(emptyForm); setShowForm(true); }}><Plus size={16} className="mr-1" />Add Train</Button>
          </div>

          {loading ? <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div> : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/60"><tr className="text-left text-slate-400">
                  <th className="px-4 py-3">Number</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Route</th><th className="px-4 py-3">Time</th><th className="px-4 py-3">Fare</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Bookings</th><th className="px-4 py-3">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-800">
                  {trains.map(t => (
                    <tr key={t.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-mono text-amber-400">{t.trainNumber}</td>
                      <td className="px-4 py-3 text-slate-200">{t.trainName}</td>
                      <td className="px-4 py-3 text-slate-300">{t.source} → {t.destination}</td>
                      <td className="px-4 py-3 text-slate-400">{t.departureTime}-{t.arrivalTime}</td>
                      <td className="px-4 py-3 text-slate-200">₹{t.fare}</td>
                      <td className="px-4 py-3"><Badge variant={t.isActive ? "success" : "danger"}>{t.isActive ? "Active" : "Inactive"}</Badge></td>
                      <td className="px-4 py-3 text-slate-400">{t._count.bookings}</td>
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => openEdit(t)} className="text-slate-400 hover:text-amber-400"><Pencil size={16} /></button>
                        {t.isActive && <button onClick={() => setDeleteConfirm(t.id)} className="text-slate-400 hover:text-red-400"><Trash2 size={16} /></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Add/Edit Form Modal */}
        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit Train" : "Add New Train"} className="max-w-2xl">
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Train Number" value={form.trainNumber} onChange={e => setForm({...form, trainNumber: e.target.value})} placeholder="12951" />
              <Input label="Train Name" value={form.trainName} onChange={e => setForm({...form, trainName: e.target.value})} placeholder="Rajdhani Express" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Source" value={form.source} onChange={e => setForm({...form, source: e.target.value})} placeholder="Mumbai" />
              <Input label="Destination" value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} placeholder="Delhi" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Departure" value={form.departureTime} onChange={e => setForm({...form, departureTime: e.target.value})} placeholder="16:00" />
              <Input label="Arrival" value={form.arrivalTime} onChange={e => setForm({...form, arrivalTime: e.target.value})} placeholder="08:30" />
              <Input label="Duration" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} placeholder="16h 30m" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Total Seats" type="number" value={String(form.totalSeats)} onChange={e => setForm({...form, totalSeats: +e.target.value})} />
              <Input label="Base Fare (₹)" type="number" value={String(form.fare)} onChange={e => setForm({...form, fare: +e.target.value})} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2"><span className="text-sm text-slate-400">Classes</span><Button size="sm" variant="ghost" onClick={addClass}><Plus size={14} className="mr-1" />Add Class</Button></div>
              {form.classes.map((c, i) => (
                <div key={i} className="grid grid-cols-[1fr_0.5fr_0.5fr_auto] gap-2 mb-2">
                  <Input placeholder="Class name" value={c.className} onChange={e => { const cls = [...form.classes]; cls[i].className = e.target.value; setForm({...form, classes: cls}); }} />
                  <Input placeholder="Multiplier" type="number" value={String(c.fareMultiplier)} onChange={e => { const cls = [...form.classes]; cls[i].fareMultiplier = +e.target.value; setForm({...form, classes: cls}); }} />
                  <Input placeholder="Seats" type="number" value={String(c.seatsAvailable)} onChange={e => { const cls = [...form.classes]; cls[i].seatsAvailable = +e.target.value; setForm({...form, classes: cls}); }} />
                  <button onClick={() => removeClass(i)} className="text-red-400 hover:text-red-300 p-2"><X size={16} /></button>
                </div>
              ))}
            </div>
            <Button onClick={handleSave} loading={saving} className="w-full">{editId ? "Save Changes" : "Create Train"}</Button>
          </div>
        </Modal>

        {/* Delete confirmation */}
        <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Deactivate Train?">
          <p className="text-slate-400 text-sm mb-4">This will hide the train from search results. Existing bookings will be preserved.</p>
          <div className="flex gap-3"><Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1">Cancel</Button><Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="flex-1">Deactivate</Button></div>
        </Modal>
      </main>
    </div>
  );
}
