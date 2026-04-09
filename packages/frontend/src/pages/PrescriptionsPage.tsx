import { useState, useEffect } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { usePrescriptions } from "../hooks/usePrescriptions";
import type { PrescriptionData } from "../types";
import { PrescriptionStatusLabels } from "../types";
import toast from "react-hot-toast";

export default function PrescriptionsPage() {
  const { account, userRole } = useWeb3();
  const { writePrescription, dispensePrescription, fetchPrescriptions, loading } = usePrescriptions();
  const [rxs, setRxs] = useState<PrescriptionData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient: "", medication: "", dosage: "", frequency: "", refills: "0", validDays: "30" });

  const load = async () => { if (account) setRxs(await fetchPrescriptions(account)); };
  useEffect(() => { load(); }, [account]);

  const handleWrite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await writePrescription(form.patient || account!, { medication: form.medication, dosage: form.dosage, frequency: form.frequency }, parseInt(form.refills), parseInt(form.validDays));
      toast.success("Prescription written to blockchain"); setShowForm(false); load();
    } catch (e: any) { toast.error(e.reason || "Failed to write prescription"); }
  };

  const handleDispense = async (rxId: number) => {
    try { await dispensePrescription(rxId); toast.success("Prescription dispensed"); load(); }
    catch (e: any) { toast.error(e.reason || "Failed to dispense"); }
  };

  const statusColors: Record<number, string> = { 0: "bg-emerald-100 text-emerald-700", 1: "bg-slate-100 text-slate-600", 2: "bg-amber-100 text-amber-700", 3: "bg-red-100 text-red-700", 4: "bg-red-100 text-red-600" };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold text-slate-900">Prescriptions</h2><p className="text-slate-500 text-sm mt-1">Write, track, and dispense prescriptions</p></div>
        {(userRole === "Doctor" || userRole === "Admin") && (
          <button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-5 rounded-xl text-sm transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Write Prescription
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Write New Prescription</h3>
          <form onSubmit={handleWrite} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Patient Address *</label><input value={form.patient} onChange={e => setForm({...form, patient: e.target.value})} placeholder="0x..." className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono" /></div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Medication *</label><input value={form.medication} onChange={e => setForm({...form, medication: e.target.value})} placeholder="Medication name and strength" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Dosage</label><input value={form.dosage} onChange={e => setForm({...form, dosage: e.target.value})} placeholder="e.g. 500mg" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Frequency</label><input value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})} placeholder="e.g. 2x daily" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Refills</label><input type="number" min="0" max="12" value={form.refills} onChange={e => setForm({...form, refills: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Valid (days)</label><input type="number" min="1" max="365" value={form.validDays} onChange={e => setForm({...form, validDays: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-medium py-2.5 px-6 rounded-lg text-sm">
                {loading ? "Processing..." : "Write to Blockchain"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-500 font-medium py-2.5 px-4 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {rxs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No prescriptions</h3>
          <p className="text-slate-400 text-sm">Prescriptions written by doctors will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rxs.map(rx => (
            <div key={rx.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-800">Rx #{rx.id}</span>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusColors[rx.status]}`}>{PrescriptionStatusLabels[rx.status as keyof typeof PrescriptionStatusLabels]}</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">Prescriber</span><span className="text-slate-600 font-mono">{rx.prescriber.slice(0,6)}...{rx.prescriber.slice(-4)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Refills left</span><span className="text-slate-600 font-semibold">{rx.refillsRemaining}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Expires</span><span className="text-slate-600">{new Date(rx.expiresAt * 1000).toLocaleDateString()}</span></div>
              </div>
              {(rx.status === 0 || rx.status === 2) && userRole === "Pharmacist" && (
                <button onClick={() => handleDispense(rx.id)} disabled={loading} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 rounded-lg text-xs transition-colors">
                  {loading ? "Dispensing..." : "Dispense"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
